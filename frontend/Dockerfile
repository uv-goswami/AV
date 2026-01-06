# frontend/Dockerfile

# --- Stage 1: Build Environment ---
# We use Node.js to compile the React/Vite source code into optimized static assets.
# 'alpine' is used to keep the build-stage footprint minimal.
FROM node:18-alpine as build

WORKDIR /app

# Dependency Optimization: 
# Copy only package files first. This allows Docker to cache the 'npm install' layer.
# Dependencies are only re-installed if package.json changes, saving build time.
COPY package*.json ./
RUN npm install

# Copy source code and execute the build script (Vite/Rollup)
# This generates the 'dist' folder containing minified JS, CSS, and HTML.
COPY . .
RUN npm run build

# --- Stage 2: Production Serving Environment ---
# We discard the Node.js environment and use Nginx to serve the static assets.
# This results in a production image that is ~90% smaller and more secure.
FROM nginx:alpine

# Deployment Logic:
# Copy the compiled production assets from the 'build' stage 
# to the directory Nginx uses to serve web content.
COPY --from=build /app/dist /usr/share/nginx/html

# Infrastructure Configuration:
# Deploy a custom Nginx config to handle Client-Side Routing (React Router).
# This ensures that deep links (e.g., /dashboard/123) don't return 404s.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Networking: Expose the standard HTTP port
EXPOSE 80

# Execution: Start Nginx in the foreground so the container remains active.
CMD ["nginx", "-g", "daemon off;"]