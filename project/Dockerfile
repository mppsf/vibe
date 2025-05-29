FROM node:18

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

WORKDIR /app
COPY . .

CMD ["node", "server/app.js"]