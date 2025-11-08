# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for Playwright and other tools
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install Yarn globally
RUN npm install -g yarn

# Copy package files first for layer caching
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy the rest of your app source
COPY . .

# Expose port (Render sets PORT env var)
EXPOSE ${PORT:-5110}

# Start the Express app
CMD ["node", "start.js"]