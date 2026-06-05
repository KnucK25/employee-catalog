// backend/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import { initDB } from './database/init';
import { Database } from 'sqlite';
import * as path from 'path'; // Импортируем модуль для работы с путями

import { employeeQueries } from './database/queries/employeeQueries';
import { departamentQueries } from './database/queries/departamentQueries';
import { postQueries } from './database/queries/postQueries';

const app = express();
app.use(express.json());

// Разрешаем запросы с любого источника — иначе браузер опрокинет
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
});

//Отдаём HTML/CSS/JS фронта
app.use(express.static(path.join(__dirname, '../../frontend')));

//Глобальная переменная для экземпляра БД
let db: Database;


//Переводим строку из базы к формату фронта
function mapEmployee(row: any) {
    return {
        id: row.id,
        name: `${row.firstname} ${row.lastname}`,
        firstname: row.firstname,
        lastname: row.lastname,
        middlename: row.middlename,
        position: row.post_name,
        department: row.departament_name,
        departament_id: row.departament_id,
        post_id: row.post_id,
        email: row.email,
        phone: row.phone,
        hireDate: row.date_admission,
        bio: row.description,
        avatar: row.image_id ? `/api/images/${row.image_id}` : null,
        image_id: row.image_id
    };
}

//Если база пустая — вставляются тестовые данные при первом запуске (иначе ничего не увидим)
async function seedDB() {
    const depCount = await db.get('SELECT COUNT(*) as cnt FROM departament');

    if (depCount && depCount.cnt > 0) {
        return;
    }

    await db.run("INSERT INTO departament (name) VALUES ('Управление')");
    await db.run("INSERT INTO departament (name) VALUES ('Маркетинг')");
    await db.run("INSERT INTO departament (name) VALUES ('Административный отдел')");

    await db.run("INSERT INTO post (name) VALUES ('Руководитель')");
    await db.run("INSERT INTO post (name) VALUES ('Маркетолог')");
    await db.run("INSERT INTO post (name) VALUES ('Ассистент')");

    await db.run(
        employeeQueries.create,
        ['Кристина', 'Лелуш', 'Александровна', 'k.lelush@staff.ru', '+7 (999) 123-45-67',
            '15.03.2020', 'Руководитель проекта с 10-летним опытом в IT-менеджменте.', 1, 1, null]
    );
    await db.run(
        employeeQueries.create,
        ['Аманда', 'Спирс', 'Джоновна', 'a.spirs@staff.ru', '+7 (999) 234-56-78',
            '22.07.2021', 'Специалист по цифровому маркетингу.', 2, 2, null]
    );
    await db.run(
        employeeQueries.create,
        ['Генри', 'Крил', 'Уолтерович', 'h.kril@staff.ru', '+7 (999) 345-67-89',
            '10.01.2023', 'Помощник руководителя. Координирует встречи и документооборот.', 3, 3, null]
    );

    console.log('Seed-данные вставлены');
}

//Маршруты сотрудников

app.get('/api/employees', async (req: Request, res: Response) => {
    try {
        const rows = await db.all(employeeQueries.getAll);
        res.json(rows.map(mapEmployee));
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения сотрудников' });
    }
});

app.get('/api/employees/search', async (req: Request, res: Response) => {
    try {
        const q = `%${req.query.q ?? ''}%`;
        const rows = await db.all(employeeQueries.search, { search: q });
        res.json(rows.map(mapEmployee));
    } catch (err) {
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

app.get('/api/employees/:id', async (req: Request, res: Response) => {
    try {
        const row = await db.get(employeeQueries.getById, [req.params.id]);

        if (!row) {
            res.status(404).json({ error: 'Сотрудник не найден' });
            return;
        }

        res.json(mapEmployee(row));
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения сотрудника' });
    }
});

app.post('/api/employees', async (req: Request, res: Response) => {
    try {
        const { firstname, lastname, middlename, email, phone, date_admission, description, departament_id, post_id, image_id } = req.body;

        const result = await db.run(employeeQueries.create, [
            firstname,
            lastname,
            middlename ?? '',
            email,
            phone,
            date_admission ?? new Date().toLocaleDateString('ru-RU'),
            description ?? '',
            departament_id,
            post_id,
            image_id ?? null
        ]);

        const newRow = await db.get(employeeQueries.getById, [result.lastID]);
        res.status(201).json(mapEmployee(newRow));
    } catch (err: any) {
        res.status(400).json({ error: err.message ?? 'Ошибка создания' });
    }
});

app.put('/api/employees/:id', async (req: Request, res: Response) => {
    try {
        const { firstname, lastname, middlename, email, phone, date_admission, description, departament_id, post_id, image_id } = req.body;

        await db.run(employeeQueries.update, [
            firstname,
            lastname,
            middlename ?? '',
            email,
            phone,
            date_admission,
            description ?? '',
            departament_id,
            post_id,
            image_id ?? null,
            req.params.id
        ]);

        const updated = await db.get(employeeQueries.getById, [req.params.id]);

        if (!updated) {
            res.status(404).json({ error: 'Сотрудник не найден' });
            return;
        }

        res.json(mapEmployee(updated));
    } catch (err: any) {
        res.status(400).json({ error: err.message ?? 'Ошибка обновления' });
    }
});

app.delete('/api/employees/:id', async (req: Request, res: Response) => {
    try {
        await db.run(employeeQueries.remove, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления' });
    }
});

//Маршруты отделов

app.get('/api/departments', async (req: Request, res: Response) => {
    try {
        const rows = await db.all(departamentQueries.getAll);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения отделов' });
    }
});

//Маршруты должностей

app.get('/api/posts', async (req: Request, res: Response) => {
    try {
        const rows = await db.all(postQueries.getAll);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения должностей' });
    }
});

//Отдаём изображение по его id из таблицы image

app.get('/api/images/:id', async (req: Request, res: Response) => {
    try {
        const row = await db.get('SELECT binary_image, mime_type FROM image WHERE id = ?', [req.params.id]);

        if (!row) {
            res.status(404).end();
            return;
        }

        res.set('Content-Type', `image/${row.mime_type}`);
        res.send(row.binary_image);
    } catch (err) {
        res.status(500).end();
    }
});

async function startServer() {
    db = await initDB()
    await seedDB();

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`)
        console.log(`Открыть http://localhost:${PORT}`);

    })
}

startServer().catch(console.error)