# FastAPI Backend Dockerfile - Railway Compatible
# Version: 1.0.2 - Force rebuild Jan 3 2026
FROM python:3.11-slim

# FORCE REBUILD - Change this number to bust Railway cache: 2026010301
ARG REBUILD_TRIGGER=2026010301

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
