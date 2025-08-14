# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app



# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy the rest of the source code
COPY . .

# Build the extension
RUN npm run compile

# Default command (can be overridden)
CMD ["npm", "run", "test"]
