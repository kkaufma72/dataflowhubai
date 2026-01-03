# Railway Dockerfile for Backend
# Simplified - runs from repo root
FROM python:3.11-slim

# Force rebuild - change this to bust cache
ARG REBUILD=2026010302

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY backend/ .

# Expose port
EXPOSE 8000

# Run FastAPI with uvicorn - Railway provides PORT env var
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
