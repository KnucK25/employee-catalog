FROM node:22-bookworm-slim

# Устанавливаем инструменты для сборки нативных модулей (sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем package.json для установки зависимостей
COPY backend/package*.json ./backend/

WORKDIR /app/backend

# Устанавливаем ВСЕ зависимости (включая dev для TypeScript)
# И пересобираем sqlite3 из исходников
RUN npm i && npm rebuild sqlite3 --build-from-source

WORKDIR /app

# Копируем исходники backend и frontend
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Компилируем TypeScript
WORKDIR /app/backend
RUN npm run build

# Создаём папку для БД с правами на запись
RUN mkdir -p /tmp/data

# Возвращаемся в корень
WORKDIR /app

ENV PORT=3000
EXPOSE 3000

# Запускаем сервер
CMD ["node", "backend/dist/server.js"]