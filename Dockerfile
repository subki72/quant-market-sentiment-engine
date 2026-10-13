# Multi-stage production Dockerfile optimized for Hugging Face Spaces & Containerized Deployments
FROM python:3.10-slim AS builder

WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency requirements
COPY requirements.txt .

# Install CPU PyTorch wheels and dependencies in isolated wheels directory
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Final minimal runtime image
FROM python:3.10-slim AS runner

WORKDIR /app

# Create non-root user for Hugging Face Spaces compatibility (UID 1000)
RUN useradd -m -u 1000 user && \
    apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed site-packages and binaries from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source code
COPY --chown=user:user src/ /app/src/
COPY --chown=user:user scripts/ /app/scripts/
COPY --chown=user:user pyproject.toml /app/
COPY --chown=user:user README.md /app/

# Create models and cache directory with proper user ownership
RUN mkdir -p /app/models /app/.cache && chown -R user:user /app

USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOST=0.0.0.0 \
    HF_HOME=/app/.cache

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

CMD ["python", "-m", "uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "7860"]
