"""Knowledge graph API routes using Neo4j.

Some endpoints are backed by Supabase/Postgres as the source of truth.
"""

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
import httpx
from neo4j import AsyncDriver
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_user
from dependencies.database import get_neo4j_driver, get_postgres_session
from schemas.auth import User
from services.lineage_rca import _jsonify_neo4j_value
from utils.config import settings


router = APIRouter()


@router.get("/datasets/graph", response_model=dict)
async def get_dataset_graph(
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
    limit: int = 200,
) -> dict:
    """Return a simple dataset graph for visualization.

    This mirrors the shape returned by the legacy browser-side Neo4j client:
    {
      nodes: [{ id, label, size, group }],
      edges: [{ from, to, label }]
    }

    Nodes are derived from (:Dataset {user_id: ...}). The node `id` will use
    `dataset_id` when present, otherwise falls back to `id`.
    """

    user_id = str(current_user.id)
    safe_limit = max(0, min(500, int(limit)))

    async with neo4j_driver.session() as session:
        nodes_result = await session.run(
            """
            MATCH (d:Dataset {user_id: $user_id})
            RETURN d
            ORDER BY coalesce(d.created_at, datetime()) DESC
            LIMIT $limit
            """,
            user_id=user_id,
            limit=safe_limit,
        )

        nodes: List[Dict[str, Any]] = []
        dataset_ids: List[str] = []
        async for record in nodes_result:
            node = record.get("d")
            if node is None:
                continue
            props = _jsonify_neo4j_value(dict(node))
            dataset_id = str(props.get("dataset_id") or props.get("id") or "")
            if not dataset_id:
                continue

            dataset_ids.append(dataset_id)
            nodes.append(
                {
                    "id": dataset_id,
                    "label": str(props.get("name") or props.get("dataset_id") or dataset_id),
                    "size": int(props.get("rows") or props.get("row_count") or 100),
                    "group": str(props.get("file_type") or props.get("file_format") or "dataset"),
                }
            )

        # Dataset-to-dataset relationships (optional)
        edges: List[Dict[str, Any]] = []
        if dataset_ids:
            rels_result = await session.run(
                """
                MATCH (d1:Dataset {user_id: $user_id})-[r]->(d2:Dataset {user_id: $user_id})
                WHERE (coalesce(d1.dataset_id, d1.id) IN $dataset_ids)
                  AND (coalesce(d2.dataset_id, d2.id) IN $dataset_ids)
                RETURN coalesce(d1.dataset_id, d1.id) as from_id,
                       coalesce(d2.dataset_id, d2.id) as to_id,
                       type(r) as rel_type
                LIMIT 1000
                """,
                user_id=user_id,
                dataset_ids=dataset_ids,
            )
            async for record in rels_result:
                from_id = record.get("from_id")
                to_id = record.get("to_id")
                rel_type = record.get("rel_type")
                if from_id and to_id and rel_type:
                    edges.append({"from": str(from_id), "to": str(to_id), "label": str(rel_type)})

    return {"nodes": nodes, "edges": edges}


@router.post("/datasets/sync", response_model=dict)
async def sync_supabase_datasets_to_neo4j(
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
    request: Request = None,
    limit: int = 200,
) -> dict:
    """Sync Supabase/Postgres datasets into Neo4j for visualization/demo.

    Reads from `public.datasets` (Supabase) and mirrors rows into Neo4j as
    (:Dataset {user_id, id, dataset_id, name, rows, columns, file_type, created_at}).

    Creates:
    - (User {id})-[:OWNS]->(Dataset)
    - A small chain of (Dataset)-[:RELATED_TO]->(Dataset) to ensure the graph
      has at least some edges for demos.
    """

    user_id = str(current_user.id)
    safe_limit = max(0, min(500, int(limit)))

    dataset_rows: List[Dict[str, Any]] = []
    source: str = "none"
    fetched: int = 0

    # Prefer hosted Supabase (what the frontend writes to).
    auth_header = request.headers.get("authorization") if request is not None else None

    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_KEY

    # If backend isn't configured with Supabase vars, allow the (public) anon key
    # + URL to be provided by the frontend, but validate to avoid SSRF.
    if request is not None and (not supabase_url or not supabase_key):
        hdr_url = (request.headers.get("x-supabase-url") or "").strip()
        hdr_key = (request.headers.get("x-supabase-anon-key") or "").strip()
        if hdr_url and hdr_key:
            if hdr_url.startswith("https://") and (".supabase.co" in hdr_url or ".supabase.in" in hdr_url):
                supabase_url = hdr_url
                supabase_key = hdr_key

    if supabase_url and supabase_key and auth_header:
        url = supabase_url.rstrip("/") + "/rest/v1/datasets"
        params = {
            "select": "id,name,file_type,row_count,column_count,created_at",
            "order": "created_at.desc",
            "limit": str(safe_limit),
        }
        headers = {
            "apikey": supabase_key,
            "Authorization": auth_header,
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url, params=params, headers=headers)
            if resp.status_code < 400:
                data = resp.json()
                if isinstance(data, list):
                    dataset_rows = data
                    source = "supabase"
        except Exception:
            dataset_rows = []

    # Fallback: local Postgres connection (dev/local schema)
    if not dataset_rows:
        dataset_rows = (
            await db.execute(
                text(
                    """
                    SELECT id, name, file_type, row_count, column_count, created_at
                    FROM datasets
                    WHERE user_id = CAST(:user_id AS uuid)
                    ORDER BY created_at DESC
                    LIMIT :limit
                    """
                ),
                {"user_id": user_id, "limit": safe_limit},
            )
        ).mappings().all()
        source = "postgres"

    fetched = len(dataset_rows)

    datasets: List[Dict[str, Any]] = []
    ordered_ids: List[str] = []
    for row in dataset_rows:
        if not isinstance(row, dict):
            continue
        ds_id = str(row.get("id") or "")
        if not ds_id:
            continue
        ordered_ids.append(ds_id)

        created_at = row.get("created_at")
        if created_at is not None and not isinstance(created_at, str):
            try:
                created_at = created_at.isoformat()
            except Exception:
                created_at = str(created_at)

        datasets.append(
            {
                "id": ds_id,
                "name": str(row.get("name") or ds_id),
                "file_type": str(row.get("file_type") or "csv"),
                "row_count": int(row.get("row_count") or 0),
                "column_count": int(row.get("column_count") or 0),
                "created_at": created_at,
            }
        )

    # Build a small deterministic edge chain for demo readability.
    # (Newest) d0 -> d1 -> d2 ...
    edges: List[Dict[str, str]] = []
    for i in range(0, max(0, len(ordered_ids) - 1)):
        edges.append({"from": ordered_ids[i], "to": ordered_ids[i + 1]})

    async with neo4j_driver.session() as session:
        result = await session.run(
            """
            MERGE (u:User {id: $user_id})
            WITH u
            UNWIND $datasets AS ds
                MERGE (d:Dataset {user_id: $user_id, id: ds.id})
                SET d.dataset_id = ds.id,
                    d.name = ds.name,
                    d.rows = ds.row_count,
                    d.columns = ds.column_count,
                    d.file_type = ds.file_type
                FOREACH (_ IN CASE WHEN ds.created_at IS NULL THEN [] ELSE [1] END |
                    SET d.created_at = datetime(ds.created_at)
                )
                MERGE (u)-[:OWNS]->(d)
            """,
            user_id=user_id,
            datasets=datasets,
        )
        await result.consume()

        rel_created = 0
        if edges:
            result = await session.run(
                """
                UNWIND $edges AS e
                    MATCH (a:Dataset {user_id: $user_id, id: e.from})
                    MATCH (b:Dataset {user_id: $user_id, id: e.to})
                    MERGE (a)-[:RELATED_TO]->(b)
                """,
                user_id=user_id,
                edges=edges,
            )
            await result.consume()
            rel_created = len(edges)

    return {
        "synced": True,
        "source": source,
        "datasets_fetched": fetched,
        "datasets_synced": len(datasets),
        "relationships_created": rel_created,
    }


@router.post("/lineage/dev/seed", response_model=dict, status_code=status.HTTP_201_CREATED)
async def seed_lineage_demo_graph(
        payload: Dict[str, Any] | None = None,
        neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
        current_user: User = Depends(get_current_user),
) -> dict:
        """Seed a small lineage graph for demo/dev usage.

        Creates:
        Dataset -> DatasetVersion (+ Filters) -> TransformationStep -> Feature
        and Feature -> ColumnProfile nodes with null-rate/type change signals.
        """

        if not settings.DEBUG and settings.ENVIRONMENT.lower() == "production":
                raise HTTPException(status_code=404, detail="Not found")

        body = payload or {}
        user_id = str(current_user.id)

        dataset_id = str(body.get("dataset_id") or "customer_churn")
        version_id = str(body.get("version_id") or "v2025_12_01")
        step_name = str(body.get("step_name") or "feature_eng_v7")
        feature_name = str(body.get("feature") or "income_bucket")

        model_id = body.get("model_id")
        model_name = str(body.get("model_name") or "demo_model")

        filters = body.get("filters")
        if not isinstance(filters, list) or not filters:
                filters = ["country = 'US'", "is_active = true"]

        async with neo4j_driver.session() as session:
                # Minimal uniqueness constraints for demo graph (Neo4j 5+ supports IF NOT EXISTS)
                for stmt in [
                        "CREATE CONSTRAINT feature_unique IF NOT EXISTS FOR (f:Feature) REQUIRE (f.user_id, f.name) IS UNIQUE",
                        "CREATE CONSTRAINT dataset_unique IF NOT EXISTS FOR (d:Dataset) REQUIRE (d.user_id, d.dataset_id) IS UNIQUE",
                        "CREATE CONSTRAINT version_unique IF NOT EXISTS FOR (v:DatasetVersion) REQUIRE (v.user_id, v.version_id) IS UNIQUE",
                        "CREATE CONSTRAINT step_unique IF NOT EXISTS FOR (t:TransformationStep) REQUIRE (t.user_id, t.name) IS UNIQUE",
                ]:
                        try:
                                await session.run(stmt)
                        except Exception:
                                # Older Neo4j versions may not support composite constraints or IF NOT EXISTS;
                                # seeding should still work without constraints.
                                pass

                cypher = """
                MERGE (d:Dataset {user_id: $user_id, dataset_id: $dataset_id})
                    ON CREATE SET d.created_at = datetime(), d.name = $dataset_id
                MERGE (v:DatasetVersion {user_id: $user_id, version_id: $version_id})
                    ON CREATE SET v.created_at = datetime(), v.dataset_id = $dataset_id
                MERGE (d)-[:HAS_VERSION]->(v)

                MERGE (t:TransformationStep {user_id: $user_id, name: $step_name})
                    ON CREATE SET t.created_at = datetime(), t.kind = 'feature_engineering', t.code_ref = 'pipelines/feature_engineering.py'
                MERGE (v)-[:FED_INTO]->(t)

                MERGE (f:Feature {user_id: $user_id, name: $feature_name})
                    ON CREATE SET f.created_at = datetime(), f.description = 'Demo feature for lineage RCA'
                MERGE (t)-[:PRODUCES]->(f)

                WITH d, v, f
                FOREACH (_ IN CASE WHEN $model_id IS NULL THEN [] ELSE [1] END |
                    MERGE (m:Model {user_id: $user_id, model_id: $model_id})
                        ON CREATE SET m.created_at = datetime(), m.name = $model_name
                    MERGE (d)-[:USED_FOR_TRAINING]->(m)
                )

                WITH v, f
                UNWIND $filters AS expr
                    MERGE (fil:Filter {user_id: $user_id, expr: expr})
                    MERGE (v)-[:APPLIED_FILTER]->(fil)

                WITH f
                // Column profiles with drift-like signals
                MERGE (cp1:ColumnProfile {user_id: $user_id, column: 'income', dataset_id: $dataset_id, version_id: $version_id})
                    SET cp1.baseline_type = 'float', cp1.current_type = 'float',
                            cp1.baseline_null_rate = 0.01, cp1.current_null_rate = 0.12
                MERGE (cp2:ColumnProfile {user_id: $user_id, column: 'employment_status', dataset_id: $dataset_id, version_id: $version_id})
                    SET cp2.baseline_type = 'string', cp2.current_type = 'int',
                            cp2.baseline_null_rate = 0.00, cp2.current_null_rate = 0.00
                MERGE (cp3:ColumnProfile {user_id: $user_id, column: 'age', dataset_id: $dataset_id, version_id: $version_id})
                    SET cp3.baseline_type = 'int', cp3.current_type = 'int',
                            cp3.baseline_null_rate = 0.02, cp3.current_null_rate = 0.03

                MERGE (f)-[:DEPENDS_ON]->(cp1)
                MERGE (f)-[:DEPENDS_ON]->(cp2)
                MERGE (f)-[:DEPENDS_ON]->(cp3)

                RETURN {
                    dataset_id: $dataset_id,
                    version_id: $version_id,
                    step_name: $step_name,
                    feature: $feature_name,
                    filters: $filters
                } as seeded
                """

                result = await session.run(
                        cypher,
                        user_id=user_id,
                        dataset_id=dataset_id,
                        version_id=version_id,
                        step_name=step_name,
                        feature_name=feature_name,
                        filters=filters,
                    model_id=str(model_id) if model_id is not None else None,
                    model_name=model_name,
                )
                record = await result.single()

        return {
                "seeded": True,
                "graph": record["seeded"] if record and record.get("seeded") else {},
        }


@router.post("/entities", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_entity(
    entity_data: Dict[str, Any],
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Create an entity in the knowledge graph.
    
    Args:
        entity_data: Entity properties (must include 'type' and 'name')
        neo4j_driver: Neo4j driver
        current_user: Current authenticated user
        
    Returns:
        Created entity information
    """
    entity_type = entity_data.get("type", "Entity")
    entity_name = entity_data.get("name")
    properties = {k: v for k, v in entity_data.items() if k not in ["type", "name"]}
    properties["user_id"] = current_user.id

    async with neo4j_driver.session() as session:
        result = await session.run(
            f"""
            CREATE (e:{entity_type} {{name: $name, properties: $properties}})
            RETURN e, id(e) as entity_id
            """,
            name=entity_name,
            properties=properties,
        )
        record = await result.single()
        
        if record:
            return {
                "entity_id": record["entity_id"],
                "type": entity_type,
                "name": entity_name,
                "properties": properties,
            }

    return {"message": "Entity created"}


@router.post("/relationships", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_relationship(
    relationship_data: Dict[str, Any],
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Create a relationship between entities in the knowledge graph.
    
    Args:
        relationship_data: Relationship info (from_id, to_id, type, properties)
        neo4j_driver: Neo4j driver
        current_user: Current authenticated user
        
    Returns:
        Created relationship information
    """
    from_id = relationship_data.get("from_id")
    to_id = relationship_data.get("to_id")
    rel_type = relationship_data.get("type", "RELATED_TO")
    properties = relationship_data.get("properties", {})

    async with neo4j_driver.session() as session:
        result = await session.run(
            f"""
            MATCH (a), (b)
            WHERE id(a) = $from_id AND id(b) = $to_id
            CREATE (a)-[r:{rel_type} $properties]->(b)
            RETURN r, id(r) as relationship_id
            """,
            from_id=from_id,
            to_id=to_id,
            properties=properties,
        )
        record = await result.single()
        
        if record:
            return {
                "relationship_id": record["relationship_id"],
                "from_id": from_id,
                "to_id": to_id,
                "type": rel_type,
                "properties": properties,
            }

    return {"message": "Relationship created"}


@router.get("/search", response_model=List[dict])
async def search_entities(
    query: str,
    entity_type: str | None = None,
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
) -> List[dict]:
    """
    Search entities in the knowledge graph.
    
    Args:
        query: Search query string
        entity_type: Filter by entity type
        neo4j_driver: Neo4j driver
        current_user: Current authenticated user
        limit: Maximum number of results
        
    Returns:
        List of matching entities
    """
    type_filter = f":{entity_type}" if entity_type else ""
    
    async with neo4j_driver.session() as session:
        result = await session.run(
            f"""
            MATCH (e{type_filter})
            WHERE e.name CONTAINS $query
            AND e.properties.user_id = $user_id
            RETURN e, id(e) as entity_id, labels(e) as types
            LIMIT $limit
            """,
            query=query,
            user_id=current_user.id,
            limit=limit,
        )
        
        entities = []
        async for record in result:
            entities.append({
                "entity_id": record["entity_id"],
                "types": record["types"],
                "properties": dict(record["e"]),
            })
        
        return entities


@router.get("/entities/{entity_id}/neighbors", response_model=dict)
async def get_entity_neighbors(
    entity_id: int,
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
    depth: int = 1,
) -> dict:
    """
    Get neighboring entities and relationships.
    
    Args:
        entity_id: Entity identifier
        neo4j_driver: Neo4j driver
        current_user: Current authenticated user
        depth: Relationship traversal depth
        
    Returns:
        Entity with its neighbors and relationships
    """
    async with neo4j_driver.session() as session:
        result = await session.run(
            f"""
            MATCH path = (e)-[*1..{depth}]-(neighbor)
            WHERE id(e) = $entity_id
            RETURN e, relationships(path) as rels, collect(neighbor) as neighbors
            LIMIT 100
            """,
            entity_id=entity_id,
        )
        
        record = await result.single()
        
        if record:
            return {
                "entity": dict(record["e"]),
                "neighbors": [dict(n) for n in record["neighbors"]],
                "relationships": [dict(r) for r in record["rels"]],
            }

    return {"entity_id": entity_id, "neighbors": [], "relationships": []}


@router.get("/insights/dataset/{dataset_id}", response_model=dict)
async def get_dataset_insights(
    dataset_id: str,
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get knowledge graph insights for a dataset.
    
    Args:
        dataset_id: Dataset identifier
        neo4j_driver: Neo4j driver
        current_user: Current authenticated user
        
    Returns:
        Dataset insights from knowledge graph
    """
    async with neo4j_driver.session() as session:
        # Get related models
        models_result = await session.run(
            """
            MATCH (d:Dataset {user_id: $user_id})
            WHERE d.dataset_id = $dataset_id OR d.id = $dataset_id
            OPTIONAL MATCH (d)-[:USED_FOR_TRAINING]->(m:Model {user_id: $user_id})
            RETURN m
            LIMIT 10
            """,
            dataset_id=dataset_id,
            user_id=str(current_user.id),
        )
        
        models = []
        async for record in models_result:
            if record.get("m") is not None:
                models.append(_jsonify_neo4j_value(dict(record["m"])))

        # Get related features
        features_result = await session.run(
            """
            MATCH (d:Dataset {user_id: $user_id})
            WHERE d.dataset_id = $dataset_id OR d.id = $dataset_id
            OPTIONAL MATCH (d)-[:HAS_FEATURE]->(f:Feature {user_id: $user_id})
            RETURN f
            LIMIT 50
            """,
            dataset_id=dataset_id,
            user_id=str(current_user.id),
        )
        
        features = []
        async for record in features_result:
            if record.get("f") is not None:
                features.append(_jsonify_neo4j_value(dict(record["f"])))

    return {
        "dataset_id": dataset_id,
        "related_models": models,
        "features": features,
        "insights": [
            "Dataset has been used to train 3 models",
            "Most important feature: 'age' with correlation 0.85",
            "Consider feature engineering on 'income' column",
        ],
    }


@router.get("/datasets/{dataset_id}/models", response_model=dict)
async def get_models_for_dataset(
    dataset_id: str,
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
) -> dict:
    """Return models associated with a dataset.

    Preferred source of truth is Supabase/Postgres (`public.datasets` + `public.models`):
    - `datasets.id` is a UUID
    - `models.dataset_id` FK references datasets.id
    - user scoping enforced via `user_id`

    For backwards compatibility with legacy/non-UUID identifiers, this endpoint falls
    back to Neo4j graph associations when `dataset_id` is not a UUID.
    """

    user_id = str(current_user.id)

    # 1) Supabase/Postgres mapping when dataset_id is a UUID
    try:
        dataset_uuid = UUID(dataset_id)
    except Exception:
        dataset_uuid = None

    if dataset_uuid is not None:
        try:
            dataset_row = (
                await db.execute(
                    text(
                        """
                        SELECT id, name, description, project_id, user_id, created_at, updated_at
                        FROM datasets
                        WHERE id = :dataset_id
                          AND user_id = CAST(:user_id AS uuid)
                        LIMIT 1
                        """
                    ),
                    {"dataset_id": dataset_uuid, "user_id": user_id},
                )
            ).mappings().first()

            if not dataset_row:
                return {
                    "source": "supabase",
                    "dataset_id": dataset_id,
                    "dataset_found": False,
                    "models": [],
                    "total": 0,
                }

            model_rows = (
                await db.execute(
                    text(
                        """
                        SELECT id, name, description, model_type, status, dataset_id, project_id,
                               user_id, hyperparameters, training_config, metadata, created_at, updated_at
                        FROM models
                        WHERE dataset_id = :dataset_id
                          AND user_id = CAST(:user_id AS uuid)
                        ORDER BY created_at DESC
                        LIMIT :limit
                        """
                    ),
                    {
                        "dataset_id": dataset_uuid,
                        "user_id": user_id,
                        "limit": max(0, min(200, int(limit))),
                    },
                )
            ).mappings().all()

            def _row_to_json(row: Dict[str, Any]) -> Dict[str, Any]:
                out: Dict[str, Any] = dict(row)
                for key in ["id", "dataset_id", "project_id", "user_id"]:
                    if key in out and out[key] is not None:
                        out[key] = str(out[key])
                for key in ["created_at", "updated_at"]:
                    if key in out and out[key] is not None:
                        out[key] = out[key].isoformat()
                return out

            return {
                "source": "supabase",
                "dataset_id": dataset_id,
                "dataset_found": True,
                "dataset": _row_to_json(dict(dataset_row)),
                "models": [_row_to_json(dict(r)) for r in model_rows],
                "total": len(model_rows),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Database query failed: {exc}")

    # 2) Neo4j fallback for non-UUID dataset identifiers
    async with neo4j_driver.session() as session:
        result = await session.run(
            """
            MATCH (d:Dataset {user_id: $user_id})
            WHERE d.dataset_id = $dataset_id OR d.id = $dataset_id
            OPTIONAL MATCH (d)-[:USED_FOR_TRAINING]->(m1:Model {user_id: $user_id})
            OPTIONAL MATCH (d)-[:HAS_VERSION]->(dv:DatasetVersion {user_id: $user_id})-[:USED_FOR_TRAINING]->(m2:Model {user_id: $user_id})
            RETURN d as dataset,
                   collect(DISTINCT m1) + collect(DISTINCT m2) as models
            """,
            user_id=user_id,
            dataset_id=dataset_id,
        )

        record = await result.single()

        if not record or record.get("dataset") is None:
            return {
                "source": "neo4j",
                "dataset_id": dataset_id,
                "dataset_found": False,
                "models": [],
                "total": 0,
            }

        dataset = _jsonify_neo4j_value(dict(record["dataset"]))

        raw_models = record.get("models") or []
        models: List[Dict[str, Any]] = []
        seen_keys: set[str] = set()

        for node in raw_models:
            if node is None:
                continue
            node_dict = _jsonify_neo4j_value(dict(node))
            key = str(node_dict.get("model_id") or node_dict.get("name") or node_dict)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            models.append(node_dict)

        models = models[: max(0, int(limit))]

        return {
            "source": "neo4j",
            "dataset_id": dataset_id,
            "dataset_found": True,
            "dataset": dataset,
            "models": models,
            "total": len(models),
        }


@router.delete("/entities/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entity(
    entity_id: int,
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete an entity from the knowledge graph.
    
    Args:
        entity_id: Entity identifier
        neo4j_driver: Neo4j driver
        current_user: Current authenticated user
    """
    async with neo4j_driver.session() as session:
        await session.run(
            """
            MATCH (e)
            WHERE id(e) = $entity_id
            DETACH DELETE e
            """,
            entity_id=entity_id,
        )

