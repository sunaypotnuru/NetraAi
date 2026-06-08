# ============================================================================
# NetraAI MCP Server - Dockerfile for Hugging Face Spaces
# ============================================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -U pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/reports data/reference

# Set environment variables for Hugging Face
ENV PYTHONUNBUFFERED=1
ENV PORT=7860
ENV HOST=0.0.0.0
ENV ENVIRONMENT=huggingface

# Expose Hugging Face default port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Use uvicorn directly (simpler, more reliable for Hugging Face)
# Add proxy headers for Hugging Face routing
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1", "--timeout-keep-alive", "120", "--proxy-headers", "--forwarded-allow-ips", "*"]

# ============================================================================
# DOCKERFILE NOTES
# ============================================================================
#
# 1. IMAGE SIZE OPTIMIZATION:
#    - Using python:3.11-slim (not full python:3.11)
#    - Removes apt cache after install
#    - Uses --no-cache-dir for pip
#    - Final image: ~300 MB (fits in 512 MB RAM)
#
# 2. GUNICORN CONFIGURATION:
#    - 1 worker (free tier has 0.1 CPU)
#    - 2 threads (handle 2 concurrent requests)
#    - 120s timeout (ML inference can take time)
#    - Logs to stdout (Render captures logs)
#
# 3. HEALTH CHECK:
#    - Checks /health endpoint every 30s
#    - Render uses this to detect failures
#    - Restarts container if unhealthy
#
# 4. ENVIRONMENT VARIABLES:
#    - Set in render.yaml (not in Dockerfile)
#    - Keeps secrets out of image
#    - Allows different configs per environment
#
# 5. MEMORY OPTIMIZATION:
#    - Slim base image
#    - Minimal system dependencies
#    - Single worker process
#    - Should use ~200-300 MB RAM
#
# 6. BUILD TIME:
#    - ~3-5 minutes on Render
#    - Cached layers speed up rebuilds
#    - requirements.txt copied first for caching
#
# 7. ALTERNATIVE (if memory issues):
#    - Use python:3.11-alpine (even smaller)
#    - Remove gunicorn, use uvicorn instead
#    - Reduce threads to 1
#
# ============================================================================
