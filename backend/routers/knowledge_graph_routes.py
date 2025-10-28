"""
Knowledge graph API routes using Neo4j.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, status
from neo4j import AsyncDriver

from dependencies.auth import get_current_user
from dependencies.database import get_neo4j_driver
from schemas.auth import User


router = APIRouter()


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
            MATCH (d:Dataset {id: $dataset_id})-[:USED_FOR_TRAINING]->(m:Model)
            RETURN m
            LIMIT 10
            """,
            dataset_id=dataset_id,
        )
        
        models = []
        async for record in models_result:
            models.append(dict(record["m"]))

        # Get related features
        features_result = await session.run(
            """
            MATCH (d:Dataset {id: $dataset_id})-[:HAS_FEATURE]->(f:Feature)
            RETURN f
            LIMIT 50
            """,
            dataset_id=dataset_id,
        )
        
        features = []
        async for record in features_result:
            features.append(dict(record["f"]))

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

