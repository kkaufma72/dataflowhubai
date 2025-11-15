#!/bin/bash
# Quick Reference for Celery Integration

echo "═══════════════════════════════════════════════════════"
echo "  DataFlowHub AI - Celery Quick Reference"
echo "═══════════════════════════════════════════════════════"

echo ""
echo "📊 SERVICE STATUS"
echo "─────────────────────────────────────────────────────"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "NAME|celery|flower|backend"

echo ""
echo "🔗 URLS"
echo "─────────────────────────────────────────────────────"
echo "  Backend API:    http://localhost:8000"
echo "  API Docs:       http://localhost:8000/api/docs"
echo "  Flower:         http://localhost:5555"
echo "  Health Check:   http://localhost:8000/api/health"

echo ""
echo "📝 REGISTERED TASKS (16)"
echo "─────────────────────────────────────────────────────"
docker exec dataflow_celery_worker celery -A celery_app inspect registered 2>/dev/null | grep "tasks\." | sed 's/^[ ]*/  /'

echo ""
echo "🎯 QUICK COMMANDS"
echo "─────────────────────────────────────────────────────"
echo "  Start services:         docker-compose up -d backend celery_worker celery_beat flower"
echo "  Stop services:          docker-compose stop backend celery_worker celery_beat flower"
echo "  View worker logs:       docker logs dataflow_celery_worker -f"
echo "  View backend logs:      docker logs dataflow_backend -f"
echo "  List active tasks:      docker exec dataflow_celery_worker celery -A celery_app inspect active"
echo "  Purge all tasks:        docker exec dataflow_celery_worker celery -A celery_app purge"
echo "  Worker stats:           docker exec dataflow_celery_worker celery -A celery_app inspect stats"

echo ""
echo "🧪 TESTING"
echo "─────────────────────────────────────────────────────"
echo "  API test script:        cd backend && ./test_celery_api.sh"
echo "  Python test:            docker exec -it dataflow_celery_worker python test_celery_tasks.py"
echo "  Manual test:            curl -X POST http://localhost:8000/api/ml/models/test/train/async \\"
echo "                            -H 'Content-Type: application/json' \\"
echo "                            -d '{\"dataset_id\":\"test\",\"config\":{\"epochs\":3}}'"

echo ""
echo "═══════════════════════════════════════════════════════"
