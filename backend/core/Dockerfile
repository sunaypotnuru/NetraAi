# Dockerfile for Hugging Face Spaces Deployment
# Hugging Face Spaces uses port 7860 by default
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install setuptools (use latest stable versions)
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Set Python path and environment
ENV PYTHONPATH=/app
ENV ENVIRONMENT=development
ENV BYPASS_AUTH=false

# Hugging Face Spaces uses port 7860
EXPOSE 7860

# Health check using curl (more reliable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Run the application on port 7860 with increased timeout
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--timeout-keep-alive", "120"]
