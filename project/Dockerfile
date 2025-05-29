FROM node:18-alpine

WORKDIR /app

# Копируем серверные файлы
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Копируем весь проект (и client, и server)
WORKDIR /app
COPY . .

# Убедись, что wait-for-ngrok.mjs имеет shebang или явно запускается через node
CMD ["sh", "-c", "node wait-for-ngrok.mjs && node server/app.js"]
