# Use node 16
FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# For caching purposes, install deps without other changed files
COPY package.json package-lock.json ./

# Install deps
RUN npm ci

# Copy source code
COPY . ./

# Build static site
RUN npm run build

# Set things up
EXPOSE 8500