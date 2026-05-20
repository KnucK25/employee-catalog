import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDatabase() {
    const db = await open({
        //путь к файлу БД
        filename: "./database.sqlite",
        //какой драйвер использовать
        driver: sqlite3.Database,
    });

    await db.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        position TEXT NOT NULL,

        email TEXT UNIQUE,
        phone TEXT,

        department_id INTEGER,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (department_id) REFERENCES departments(id)
        );
        `);

    return db;
}