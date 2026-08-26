# ─── Stage 1: Build React Application ─────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build minified production bundle
# Empty VITE_API_BASE_URL allows relative API calls routed through Nginx reverse proxy
ENV VITE_API_BASE_URL=""
RUN npm run build

# ─── Stage 2: Serve with Lightweight Nginx ────────────────────────────────────
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
