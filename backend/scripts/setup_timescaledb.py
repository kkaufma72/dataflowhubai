"""
Script to initialize TimescaleDB with hypertables and continuous aggregates.
Run this once after starting the TimescaleDB container.
"""

import asyncio
import sys
from pathlib import Path

import asyncpg
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent))

from utils.config import settings


async def run_sql_file(connection, sql_file_path: Path):
    """Execute SQL commands from a file."""
    print(f"Executing SQL from {sql_file_path.name}...")
    
    sql_content = sql_file_path.read_text()
    
    # Split by semicolon and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    for i, statement in enumerate(statements, 1):
        try:
            # Skip comments and empty lines
            if statement.startswith('--') or not statement:
                continue
                
            await connection.execute(statement)
            print(f"  ✓ Executed statement {i}/{len(statements)}")
        except Exception as e:
            print(f"  ✗ Error in statement {i}: {e}")
            print(f"    Statement: {statement[:100]}...")
            # Continue with other statements
    
    print(f"✓ Completed {sql_file_path.name}\n")


async def initialize_timescaledb():
    """Initialize TimescaleDB with hypertables and aggregates."""
    print("=" * 70)
    print("TimescaleDB Initialization Script")
    print("=" * 70)
    print()
    
    # Build connection URL
    timescaledb_url = settings.timescaledb_url
    # Remove asyncpg dialect prefix for asyncpg connection
    if 'postgresql+asyncpg' in timescaledb_url:
        timescaledb_url = timescaledb_url.replace('postgresql+asyncpg', 'postgresql')
    elif '+' in timescaledb_url:
        # Handle any other dialect prefix
        timescaledb_url = 'postgresql' + timescaledb_url.split('+', 1)[1]
    
    print(f"Connecting to TimescaleDB at {settings.TIMESCALEDB_HOST}:{settings.TIMESCALEDB_PORT}...")
    
    try:
        # Create connection
        conn = await asyncpg.connect(timescaledb_url)
        
        print("✓ Connected successfully\n")
        
        # Get SQL file path
        sql_file = Path(__file__).parent / "init_timescaledb.sql"
        
        if not sql_file.exists():
            print(f"✗ SQL file not found: {sql_file}")
            return
        
        # Execute SQL file
        await run_sql_file(conn, sql_file)
        
        # Verify hypertables were created
        print("Verifying hypertables...")
        hypertables = await conn.fetch("""
            SELECT hypertable_name 
            FROM timescaledb_information.hypertables
        """)
        
        print("\nCreated hypertables:")
        for row in hypertables:
            print(f"  ✓ {row['hypertable_name']}")
        
        # Verify continuous aggregates
        print("\nVerifying continuous aggregates...")
        aggregates = await conn.fetch("""
            SELECT view_name, materialization_hypertable_name
            FROM timescaledb_information.continuous_aggregates
        """)
        
        if aggregates:
            print("\nCreated continuous aggregates:")
            for row in aggregates:
                print(f"  ✓ {row['view_name']} -> {row['materialization_hypertable_name']}")
        else:
            print("  (No continuous aggregates found)")
        
        # Close connection
        await conn.close()
        
        print("\n" + "=" * 70)
        print("✓ TimescaleDB initialization complete!")
        print("=" * 70)
        print("\nYou can now use the TimescaleDB service to record metrics.")
        print("Example: POST /api/monitoring/metrics/{model_id}")
        
    except asyncpg.exceptions.InvalidCatalogNameError:
        print(f"✗ Database '{settings.TIMESCALEDB_DB}' does not exist.")
        print("\nTo create the database, run:")
        print(f"  docker exec -it dataflow_timescaledb psql -U {settings.TIMESCALEDB_USER} -c \"CREATE DATABASE {settings.TIMESCALEDB_DB};\"")
        
    except asyncpg.exceptions.InvalidPasswordError:
        print("✗ Authentication failed. Check your TimescaleDB credentials in .env")
        print(f"   Expected: TIMESCALEDB_USER={settings.TIMESCALEDB_USER}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(initialize_timescaledb())
