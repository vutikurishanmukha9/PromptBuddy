# ==============================================================================
# PromptBuddy Unified Full-Stack Production Dockerfile
# Builds React frontend & runs FastAPI backend in a single enterprise container
# ==============================================================================

# Stage 1: Build React frontend static SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --silent || npm install --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend Runner
FROM python:3.11-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/main.py .
COPY backend/app/ ./app/
COPY backend/skills-catalog/ ./skills-catalog/

# Copy built frontend assets into dist/ for unified static serving
COPY --from=frontend-builder /build/dist ./dist

# Create non-root user for enterprise security
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5000}"]
