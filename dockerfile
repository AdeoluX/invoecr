# Use official Playwright image with Node.js (Ubuntu 24.04 base for stability)
FROM mcr.microsoft.com/playwright:v1.55.0-noble

# Set working directory
WORKDIR /app

# Install Yarn globally (ensures compatibility with yarn.lock)
RUN npm install -g yarn

# Copy package files first for layer caching
COPY package.json yarn.lock* ./

# Install dependencies (allow lockfile updates; --ignore-engines skips Node checks)
RUN yarn install --ignore-engines --non-interactive

# Copy the rest of your app source
COPY . .

# Expose port (Render sets PORT env var)
EXPOSE $PORT

# Start the Express app (exec form: no shell, direct exec)
CMD ["yarn", "start"]