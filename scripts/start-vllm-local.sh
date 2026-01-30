#!/bin/bash
# Run vLLM with Llama 3.1 8B (smaller model for local dev)

docker run -d \
  --name vllm-server \
  --gpus all \
  -p 8001:8000 \
  vllm/vllm-openai:latest \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --port 8000

echo "vLLM server starting on http://localhost:8001"
echo ""
echo "Add to your .env:"
echo "VLLM_ENDPOINT=http://localhost:8001/v1/chat/completions"
echo "VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct"
