FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./
COPY client/ ./client/
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "app.js"]