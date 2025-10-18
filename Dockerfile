# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S theneo && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G theneo -g theneo theneo

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R theneo:theneo /app

# Switch to non-root user
USER theneo

# Environment variables
ENV NODE_ENV=production

# Expose MCP stdio interface
# Note: MCP servers typically communicate over stdio, not HTTP
# If you need HTTP, add: EXPOSE 3000

# Health check (adjust if using HTTP)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "process.exit(0)"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the MCP server
CMD ["node", "dist/server.js"]

