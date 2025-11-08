# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for Playwright, Yarn, and other tools
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    yarn \
    && rm -rf /var/cache/apk/*

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files first for layer caching
COPY package.json yarn.lock* ./

# Install dependencies (allow lockfile updates if needed)
RUN yarn install --production=false

# Copy the rest of your app source
COPY . .

# Expose port (Render sets PORT env var)
EXPOSE ${PORT:-5110}

# Start the Express app
CMD ["node", "start.js"]