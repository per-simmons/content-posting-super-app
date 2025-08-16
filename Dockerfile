# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps for Tailwind v4
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]
# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Ensure native deps (e.g., sharp) work on Alpine
RUN apk add --no-cache libc6-compat

# Install a tiny init to handle PID 1 signals/children (helps with dev servers)
RUN apk add --no-cache tini

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies with legacy peer deps for Tailwind v4
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Dev-friendly env
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

# Next.js dev must listen on all interfaces inside the container
# so that Docker port mappings work from host
EXPOSE 3000

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "-g", "--"]

# Start the Next.js dev server and bind to 0.0.0.0 so health/port checks succeed
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]