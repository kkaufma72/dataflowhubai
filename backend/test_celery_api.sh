#!/bin/bash
# Test script for Celery async training endpoints

set -e

BASE_URL="http://localhost:8000"
API_URL="${BASE_URL}/api/ml"

echo "🧪 Testing DataFlowHub AI Celery Integration"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s -f "${BASE_URL}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${RED}✗${NC} Backend is not running. Please start it with: docker-compose up -d backend"
    exit 1
fi

# Check Flower dashboard
echo ""
echo "2. Checking Flower monitoring dashboard..."
if curl -s -f "http://localhost:5555" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Flower dashboard is accessible at http://localhost:5555"
else
    echo -e "${YELLOW}⚠${NC} Flower dashboard is not accessible"
fi

# Test async training endpoint
echo ""
echo "3. Testing async model training..."
echo -e "${YELLOW}→${NC} Starting training task..."

TRAIN_RESPONSE=$(curl -s -X POST "${API_URL}/models/test-model-123/train/async" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "test-dataset-456",
    "config": {
      "epochs": 3,
      "batch_size": 32,
      "learning_rate": 0.001
    }
  }' 2>&1)

if echo "$TRAIN_RESPONSE" | grep -q "task_id"; then
    TASK_ID=$(echo "$TRAIN_RESPONSE" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} Training task started!"
    echo "   Task ID: $TASK_ID"
    echo "   Response: $TRAIN_RESPONSE"
    
    # Poll task status
    echo ""
    echo "4. Polling task status..."
    for i in {1..10}; do
        sleep 2
        echo -e "${YELLOW}→${NC} Check #$i..."
        
        STATUS_RESPONSE=$(curl -s "${API_URL}/tasks/${TASK_ID}")
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        echo "   Status: $STATUS"
        echo "   Response: $STATUS_RESPONSE"
        
        if [ "$STATUS" = "SUCCESS" ] || [ "$STATUS" = "FAILURE" ]; then
            break
        fi
    done
    
    if [ "$STATUS" = "SUCCESS" ]; then
        echo -e "${GREEN}✓${NC} Task completed successfully!"
    elif [ "$STATUS" = "FAILURE" ]; then
        echo -e "${RED}✗${NC} Task failed"
    else
        echo -e "${YELLOW}⚠${NC} Task still running (check Flower dashboard for details)"
    fi
else
    echo -e "${RED}✗${NC} Failed to start training task"
    echo "   Response: $TRAIN_RESPONSE"
fi

# Test batch prediction endpoint
echo ""
echo "5. Testing batch predictions..."
echo -e "${YELLOW}→${NC} Starting batch prediction task..."

PREDICT_RESPONSE=$(curl -s -X POST "${API_URL}/models/test-model-123/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": [
      {"feature1": 1.0, "feature2": 2.0, "feature3": 3.0},
      {"feature1": 1.5, "feature2": 2.5, "feature3": 3.5},
      {"feature1": 2.0, "feature2": 3.0, "feature3": 4.0}
    ]
  }' 2>&1)

if echo "$PREDICT_RESPONSE" | grep -q "task_id"; then
    PREDICT_TASK_ID=$(echo "$PREDICT_RESPONSE" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} Batch prediction task started!"
    echo "   Task ID: $PREDICT_TASK_ID"
    echo "   Response: $PREDICT_RESPONSE"
else
    echo -e "${RED}✗${NC} Failed to start batch prediction task"
    echo "   Response: $PREDICT_RESPONSE"
fi

# List active tasks
echo ""
echo "6. Listing active tasks..."
ACTIVE_TASKS=$(curl -s "${API_URL}/tasks")
echo "$ACTIVE_TASKS" | head -20

echo ""
echo "=============================================="
echo -e "${GREEN}✓${NC} Test completed!"
echo ""
echo "Next steps:"
echo "  • View tasks in Flower: http://localhost:5555/tasks"
echo "  • Check API docs: http://localhost:8000/api/docs"
echo "  • View logs: docker logs dataflow_celery_worker"
echo ""
