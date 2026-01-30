# vLLM Dockerfile for Railway deployment
FROM vllm/vllm-openai:latest

# Set the model to download on startup
ENV MODEL_NAME="meta-llama/Meta-Llama-3.1-8B-Instruct"
ENV PORT=8000

# Railway will inject $PORT - vLLM uses --port flag
CMD python -m vllm.entrypoints.openai.api_server \
    --model ${MODEL_NAME} \
    --host 0.0.0.0 \
    --port ${PORT} \
    --max-model-len 4096 \
    --trust-remote-code
