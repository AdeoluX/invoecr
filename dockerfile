# Use official Playwright image with Node.js (update '20' to your Node version if needed; matches Render's default)
FROM mcr.microsoft.com/playwright:v1.47.0-focal  # Pin to stable; update to latest via 'docker pull' locally if testing

# Set working directory
WORKDIR /app

# Install Yarn globally (since your project uses it)
RUN npm install -g yarn

# Copy package files first (for better caching)
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false  # Include devDeps if needed for build

# Copy app source
COPY . .

# No build step needed (your app is plain JS), but add if you ever transpile
# RUN yarn run build  # Uncomment if adding a build script

# Expose port (Render sets PORT env; your app listens on process.env.PORT)
EXPOSE $PORT

# Health check (optional, for Render monitoring)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node healthcheck.js || exit 1

# Start the app
CMD ["yarn", "start"]  # Runs 'node start.js' per your package.json