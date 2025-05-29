# Используем легковесный Node.js образ
FROM node:18-alpine

# Рабочая директория внутри контейнера
WORKDIR /app/server

# Копируем package.json и package-lock.json из папки server для установки зависимостей
COPY server/package*.json ./

# Устанавливаем только production-зависимости (без dev)
RUN npm install --omit=dev

# Возвращаемся в корень /app
WORKDIR /app

# Копируем весь проект (client, server и другие файлы)
COPY . .

# Запускаем сначала скрипт ожидания ngrok, затем сервер
CMD ["sh", "-c", "node wait-for-ngrok.mjs && node server/app.js"]
