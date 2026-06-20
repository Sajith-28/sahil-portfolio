# ============================================================
# PRODUCTION DOCKERFILE
# Multi-stage/Optimized Build for FastAPI Deployment
# ============================================================

FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies in a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Final Stage ---
FROM python:3.11-slim

WORKDIR /app

# Copy virtual env from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy source code files
COPY . .

# Set runtime variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start app using Gunicorn with Uvicorn worker for asynchronous FastAPI performance
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
