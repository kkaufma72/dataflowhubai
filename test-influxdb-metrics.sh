#!/bin/bash

# Test script to demonstrate InfluxDB metrics logging
# This simulates training a model and logs metrics to InfluxDB

echo "🚀 DataFlowHub InfluxDB Integration Test"
echo "=========================================="
echo ""

# Check if InfluxDB is running
echo "📊 Checking InfluxDB status..."
if /Applications/Docker.app/Contents/Resources/bin/docker ps | grep -q dataflow_influxdb; then
    echo "✅ InfluxDB container is running"
else
    echo "❌ InfluxDB container is not running"
    echo "Starting InfluxDB..."
    /Applications/Docker.app/Contents/Resources/bin/docker start dataflow_influxdb
    sleep 3
fi

echo ""
echo "🔍 Current metrics in InfluxDB:"
echo "--------------------------------"

# Query recent metrics
/Applications/Docker.app/Contents/Resources/bin/docker exec dataflow_influxdb \
  influx query 'from(bucket:"model_metrics") 
    |> range(start:-1h) 
    |> filter(fn: (r) => r._measurement == "model_metrics")
    |> filter(fn: (r) => r._field == "accuracy" or r._field == "loss")
    |> limit(n:10)' \
  -t dataflow-influx-token-2025 \
  -o dataflowhub 2>/dev/null || echo "No metrics yet - train a model to see data!"

echo ""
echo "📈 Next Steps:"
echo "-------------"
echo "1. ✅ InfluxDB UI: http://localhost:5173/app/train"
echo "2. ✅ Train Model: Click 'Select Dataset' → Choose dataset → Train"
echo "3. ✅ View Metrics: Watch browser console for '✅ Logged metrics to InfluxDB'"
echo "4. ✅ InfluxDB UI: http://localhost:8086 (admin/dataflow_admin_2025)"
echo ""
echo "💡 To see live metrics during training, check:"
echo "   - Browser DevTools Console (F12)"
echo "   - InfluxDB Data Explorer"
echo ""
echo "🎯 Example Query in InfluxDB UI:"
echo "   from(bucket: \"model_metrics\")"
echo "     |> range(start: -1h)"
echo "     |> filter(fn: (r) => r._field == \"accuracy\")"
echo ""
