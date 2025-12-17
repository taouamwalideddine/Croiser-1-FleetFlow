# build stage - creates optimized production build
from node:18-alpine as builder
workdir /app

# copy package files first for better layer caching
copy package*.json ./
# install only production dependencies
run npm ci --only=production

# copy rest of the application
copy . .

# runtime stage - creates lightweight production image
from node:18-alpine
workdir /app

# copy only necessary files from builder stage
copy --from=builder /app/node_modules ./node_modules
copy --from=builder /app/package*.json ./
copy --from=builder /app/src ./src

# create non-root user for security
run addgroup -s appgroup && adduser -s appuser -g appgroup
user appuser

# health check configuration
# checks if the container is responsive
healthcheck --interval=30s --timeout=10s --start-period=5s --retries=3 \
  cmd wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# expose the default port
expose 3000

# command to run the application
cmd ["node", "src/server.js"]
