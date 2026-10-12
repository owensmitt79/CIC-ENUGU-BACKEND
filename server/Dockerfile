# ==============================================================================
# Dockerfile for CIC Enugu 1995 Alumni Association Portal Backend (Server Directory)
# Project: CIC-ENUGU-25-SET
# ==============================================================================

FROM node:20-slim

# Install system dependencies required by Prisma engine, SSL, and health checks
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./

# Install all server dependencies including Prisma CLI
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose backend service port (default: 5050)
EXPOSE 5050

# Set default production environment
ENV NODE_ENV=production \
    PORT=5050

# Health check to monitor backend availability and database connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5050/health || exit 1

# Ensure database schema is synchronized, seeded if fresh, and start the server
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && npm start"]
