# 1. Base image
FROM node:20-alpine 

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first (better caching)
COPY package*.json ./

# 4. Install only production dependencies
RUN npm install --only=production

# 5. Copy the rest of the backend code
COPY . .

# 6. Expose backend port
EXPOSE 3000

# 7. Start command
CMD ["node", "server.js"]
