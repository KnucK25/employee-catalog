// backend/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import { initDB } from './database/init';
import { Database } from 'sqlite';
import * as path from 'path'; // Импортируем модуль для работы с путями

// ... здесь ваши импорты контроллеров и сервисов ...
// import { EmployeeController } from './controllers/EmployeeController';
// и так далее

const app = express();
app.use(express.json());

// Глобальная переменная для экземпляра БД (или можно использовать DI/контекст)
let db: Database;

async function startServer() {
    db = await initDB()

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`)
    })
}

startServer().catch(console.error)