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

# Playwright will use its own installed browser
# We install it explicitly above, so no need to skip download

# Copy package files first for layer caching
COPY package.json yarn.lock* ./

# Install dependencies (allow lockfile updates if needed)
RUN yarn install --production=false

# Install Playwright Chromium browser (required for PDF generation)
RUN npx playwright install chromium || yarn playwright install chromium || true

# Copy the rest of your app source
COPY . .

# Expose port (Render sets PORT env var)
EXPOSE ${PORT:-5110}

# Start the Express app
CMD ["node", "start.js"]