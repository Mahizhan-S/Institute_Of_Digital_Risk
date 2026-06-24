# ============================================================
# Dockerfile for the Transaction Ranking System
# 
# This builds a container with:
# 1. Python backend (FastAPI)
# 2. Node.js to build the React frontend
# 3. The built frontend is served by FastAPI as static files
# ============================================================

# --- Stage 1: Build the React frontend ---
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first (Docker caches this layer)
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend code
COPY frontend/ ./

# Build the React app (outputs to /app/frontend/dist)
RUN npm run build


# --- Stage 2: Python backend ---
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for asyncpg (PostgreSQL client)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ ./backend/

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the port
EXPOSE 8000

# Run the FastAPI app with uvicorn
# Use shell syntax to evaluate the PORT environment variable provided by Render
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
