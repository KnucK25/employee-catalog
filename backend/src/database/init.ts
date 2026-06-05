import sqlite3 from "sqlite3";
import { open, Database } from 'sqlite';
import * as path from 'path';
import * as fs from 'fs';

export async function initDB(): Promise<Database> {
    const db = await open({
        filename: path.join(__dirname, '../../database.sqlite'),
        driver: sqlite3.Database,
    })

    await db.run('PRAGMA foreign_keys = ON;');

    // 3. Читаем SQL-файл со схемой
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // 4. Выполняем скрипт создания таблиц и индексов
    await db.exec(schema);

    console.log('✅ База данных инициализирована. Внешние ключи включены.');

    return db
}