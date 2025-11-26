#!/usr/bin/env python3
"""
Simple Local API Server for FRED Dataset Import
Connects directly to PostgreSQL Docker container
"""

import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Optional
from uuid import uuid4

# Try to import asyncpg, fall back to psycopg2
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    DB_DRIVER = 'psycopg2'
except ImportError:
    print("Installing psycopg2...")
    os.system("pip3 install psycopg2-binary")
    import psycopg2
    from psycopg2.extras import RealDictCursor
    DB_DRIVER = 'psycopg2'

# Database configuration
DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", "5432")),
    "database": os.getenv("POSTGRES_DB", "dataflow_hub"),
    "user": os.getenv("POSTGRES_USER", "dataflow_user"),
    "password": os.getenv("POSTGRES_PASSWORD", "dataflow_secure_password"),
}

def get_db_connection():
    """Get database connection."""
    return psycopg2.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        database=DB_CONFIG["database"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        cursor_factory=RealDictCursor
    )


class LocalAPIHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for local API."""

    def _send_response(self, status: int, data: dict):
        """Send JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())

    def _send_error(self, status: int, message: str):
        """Send error response."""
        self._send_response(status, {"error": message})

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        path = self.path.split('?')[0]
        
        if path == '/api/health':
            try:
                conn = get_db_connection()
                conn.close()
                self._send_response(200, {"status": "healthy", "database": "connected"})
            except Exception as e:
                self._send_response(503, {"status": "unhealthy", "error": str(e)})
        
        elif path == '/api/datasets':
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM datasets ORDER BY created_at DESC")
                rows = cursor.fetchall()
                conn.close()
                self._send_response(200, [dict(row) for row in rows])
            except Exception as e:
                self._send_error(500, str(e))
        
        elif path.startswith('/api/datasets/'):
            dataset_id = path.split('/')[-1]
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM datasets WHERE id = %s", (dataset_id,))
                row = cursor.fetchone()
                conn.close()
                if row:
                    self._send_response(200, dict(row))
                else:
                    self._send_error(404, "Dataset not found")
            except Exception as e:
                self._send_error(500, str(e))
        
        elif path == '/api/projects':
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
                rows = cursor.fetchall()
                conn.close()
                self._send_response(200, [dict(row) for row in rows])
            except Exception as e:
                self._send_error(500, str(e))
        
        else:
            self._send_error(404, "Not found")

    def do_POST(self):
        """Handle POST requests."""
        path = self.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length)) if content_length > 0 else {}
        
        if path == '/api/datasets':
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                
                dataset_id = str(uuid4())
                now = datetime.utcnow()
                
                # Get or create default project
                project_id = body.get('project_id')
                if not project_id:
                    cursor.execute("SELECT id FROM projects LIMIT 1")
                    row = cursor.fetchone()
                    if row:
                        project_id = str(row['id'])
                    else:
                        project_id = str(uuid4())
                        cursor.execute(
                            """INSERT INTO projects (id, name, description, created_at, updated_at)
                               VALUES (%s, %s, %s, %s, %s)""",
                            (project_id, "Default Project", "Auto-created", now, now)
                        )
                
                # Insert dataset
                cursor.execute(
                    """INSERT INTO datasets (
                        id, name, description, file_type, file_size, 
                        rows, columns, row_count, column_count,
                        preview_data, project_id, user_id, source, 
                        metadata, tags, size_mb, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *""",
                    (
                        dataset_id,
                        body.get('name', 'Unnamed'),
                        body.get('description'),
                        body.get('file_type', 'json'),
                        body.get('file_size', '0 KB'),
                        body.get('rows', 0),
                        body.get('columns', 0),
                        body.get('rows', 0),  # row_count
                        body.get('columns', 0),  # column_count
                        json.dumps(body.get('preview_data', {})),
                        project_id,
                        body.get('user_id'),
                        body.get('source', 'upload'),
                        json.dumps(body.get('metadata', {})),
                        body.get('tags', []),
                        body.get('size_mb'),
                        now,
                        now
                    )
                )
                
                new_dataset = cursor.fetchone()
                conn.commit()
                conn.close()
                
                print(f"✅ Created dataset: {dataset_id} - {body.get('name')}")
                self._send_response(201, dict(new_dataset))
                
            except Exception as e:
                print(f"❌ Error creating dataset: {e}")
                self._send_error(500, str(e))
        
        elif path == '/api/projects':
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                
                project_id = str(uuid4())
                now = datetime.utcnow()
                
                cursor.execute(
                    """INSERT INTO projects (id, name, description, user_id, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       RETURNING *""",
                    (
                        project_id,
                        body.get('name', 'New Project'),
                        body.get('description'),
                        body.get('user_id'),
                        now,
                        now
                    )
                )
                
                new_project = cursor.fetchone()
                conn.commit()
                conn.close()
                
                self._send_response(201, dict(new_project))
                
            except Exception as e:
                self._send_error(500, str(e))
        
        else:
            self._send_error(404, "Not found")

    def do_DELETE(self):
        """Handle DELETE requests."""
        path = self.path
        
        if path.startswith('/api/datasets/'):
            dataset_id = path.split('/')[-1]
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM datasets WHERE id = %s", (dataset_id,))
                conn.commit()
                conn.close()
                self._send_response(204, {})
            except Exception as e:
                self._send_error(500, str(e))
        else:
            self._send_error(404, "Not found")

    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")


def run_server(port: int = 8000):
    """Run the local API server."""
    server = HTTPServer(('0.0.0.0', port), LocalAPIHandler)
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║       🗄️  Local PostgreSQL API Server                      ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:{port}                 ║
║  Health check:      http://localhost:{port}/api/health      ║
║  Datasets API:      http://localhost:{port}/api/datasets    ║
║                                                           ║
║  Database: {DB_CONFIG['database']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}                ║
║                                                           ║
║  Press Ctrl+C to stop                                     ║
╚═══════════════════════════════════════════════════════════╝
""")
    
    # Test database connection
    try:
        conn = get_db_connection()
        conn.close()
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("   Make sure PostgreSQL is running: docker-compose up -d postgres")
    
    server.serve_forever()


if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)

