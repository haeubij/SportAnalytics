FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY src/ ./src/

RUN mkdir -p logs

EXPOSE 3002

CMD ["node", "src/server.js"]
