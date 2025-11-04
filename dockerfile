# Use official Playwright image with Node.js (Ubuntu 24.04 base; matches Render's Node 20+ runtime)
# Latest as of Nov 2025: v1.56.1-noble. Pin for reproducibility; update via docs if needed.
FROM mcr.microsoft.com/playwright:v1.56.1-noble

# Set working directory
WORKDIR /app

# Install Yarn globally (your project uses yarn.lock)
RUN npm install -g yarn

# Copy package files first (optimizes caching during builds)
COPY package.json yarn.lock* ./

# Install dependencies (includes Playwright; --frozen-lockfile for exact versions)
RUN yarn install --frozen-lockfile

# Copy the rest of your app source
COPY . .

# Expose the port (Render injects process.env.PORT dynamically)
EXPOSE $PORT

# Optional: Health check script (create a simple healthcheck.js if desired)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node healthcheck.js || exit 1

# Start the Express app
CMD ["yarn", "start"]  # Runs 'node start.js' as per your package.json