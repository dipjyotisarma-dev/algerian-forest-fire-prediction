# ==========================================
# Stage 1: Build the React / TypeScript Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY src/frontend/package*.json ./
RUN npm ci

COPY src/frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Python Backend Service
# ==========================================
FROM python:3.11-slim AS production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Install build dependencies if needed, then clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy serialized models and source code
COPY models/ ./models/
COPY src/ ./src/

# Copy built frontend from Stage 1 into the backend static mount directory
COPY --from=frontend-builder /app/frontend/dist ./src/frontend/dist

# Expose default port
EXPOSE 8000

# Start FastAPI via Uvicorn respecting dynamic cloud environment PORT
CMD ["sh", "-c", "uvicorn src.backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
