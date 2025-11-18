FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json ./
RUN npm install

# Copy application code
COPY . .

# Expose Metro bundler port and Expo DevTools
EXPOSE 8081 19000 19001 19002

# Start Expo
CMD ["npx", "expo", "start", "--web"]
