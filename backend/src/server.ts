// backend/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import { initDB } from './database/init';
import { Database } from 'sqlite';
import * as path from 'path'; // Импортируем модуль для работы с путями
import * as fs from 'fs'; // <-- Добавляем fs для чтения файлов

import * as crypto from 'crypto';

import { employeeQueries } from './database/queries/employeeQueries';
import { departamentQueries } from './database/queries/departamentQueries';
import { postQueries } from './database/queries/postQueries';
import { imageQueries } from './database/queries/imageQueries';
import { accountQueries } from './database/queries/accountQueries';

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

// Токены хранятся в памяти: token → { employeeId, expiresAt }
const sessions = new Map<string, { employeeId: number; expiresAt: number }>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 часов

function hashPassword(password: string, salt: string): string {
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'Требуется авторизация' });
        return;
    }

    const session = sessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
        sessions.delete(token);
        res.status(401).json({ error: 'Сессия истекла, войдите снова' });
        return;
    }

    next();
}


//Переводим строку из базы к формату фронта
function mapEmployee(row: any) {
    return {
        id: row.id,
        name: `${row.lastname} ${row.firstname} ${row.middlename}`,
        firstname: row.firstname,
        lastname: row.lastname,
        middlename: row.middlename,
        post: row.post_name,
        departament: row.departament_name,
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

// Загружает тестовые фотографии из папки test_images. Не использовать для загрузки с клиента.
async function seedImg(filename: string): Promise<number | null> {
    const imgPath = path.join(__dirname, '../test_images', filename)

    if (!fs.existsSync(imgPath)) {
        console.warn(`Файл не найден: ${filename}`)
        return null
    }

    try {
        const binaryImg = fs.readFileSync(imgPath)
        const sizeBytes = binaryImg.length

        let mimeType = ''
        if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
            mimeType = 'jpeg';
        } else if (filename.toLowerCase().endsWith('.png')) {
            mimeType = 'png';
        } else if (filename.toLowerCase().endsWith('.webp')) {
            mimeType = 'webp';
        } else {
            console.warn(`⚠️ Неподдерживаемый формат файла: ${filename}`);
            return null;
        }

        const result = await db.run(imageQueries.create, [
            binaryImg,
            mimeType,
            sizeBytes
        ])

        return result.lastID ?? null
    } catch (err) {
        console.error(`Ошибка загрузки ${filename}`, err)
        return null
    }
}

//Если база пустая — вставляются тестовые данные при первом запуске (иначе ничего не увидим)
async function seedDB() {
    const depCount = await db.get('SELECT COUNT(*) as cnt FROM departament');

    if (depCount && depCount.cnt > 0) {
        return;
    }

    const testDepartaments = [
        ['Администрация'],
        ['Маркетинг'],
        ['Финансы'],
        ['IT'],
        ['HR']
    ]

    const testPosts = [
        ['1', 'Генеральный директор'],
        ['1', 'Офис-менеджер'],
        ['2', 'Дизайнер'],
        ['2', 'SEO-специалист'],
        ['2', 'SMM-менеджер'],
        ['3', 'Главный бухгалтер'],
        ['3', 'Бухгалтер'],
        ['4', 'Frontend-разработчик'],
        ['4', 'Backend-разработчик'],
        ['4', 'Системный администратор'],
        ['5', 'Рекрутер'],
        ['5', 'Сорсер']
    ]

    const testImgs = [
        'gen_dir.webp',
        'office_manager1.webp',
        'office_manager2.webp',
        'designer1.webp',
        'designer2.webp',
        'seo1.webp',
        'seo2.webp',
        'smm1.webp',
        'smm2.webp',
        'glaw_buh.webp',
        'buh1.webp',
        'buh2.webp',
        'front1.webp',
        'front2.webp',
        'back1.webp',
        'back2.webp',
        'sysad.webp',
        'rek1.webp',
        'rek2.webp',
        'sourcer.webp'
    ]

    type EmployeeSeedRow = [string, string, string, string, string, string, string, number, (number | null)];
    const testEmployees: EmployeeSeedRow[] = [
        // Генеральный директор (1) - Администрация (1)
        ['Иванов', 'Иван', 'Сергеевич', 'i.ivanov@staff.ru', '+7 (911) 100-01-01', '10.02.2020', 'Руководит компанией, определяет стратегию развития и координирует работу всех подразделений.', 1, 0],

        // Офис-менеджеры (2) - Администрация (1)
        ['Петров', 'Алексей', 'Дмитриевич', 'a.petrov@staff.ru', '+7 (911) 100-01-02', '15.03.2020', 'Обеспечивает бесперебойную работу офиса, ведёт документооборот и встречает посетителей.', 2, 1],
        ['Смирнов', 'Михаил', 'Александрович', 'm.smirnov@staff.ru', '+7 (911) 100-01-03', '20.04.2020', 'Координирует работу офиса, организует совещания и контролирует хозяйственное обеспечение.', 2, 2],

        // Дизайнеры (2) - Маркетинг (2)
        ['Кузнецов', 'Дмитрий', 'Николаевич', 'd.kuznecov@staff.ru', '+7 (911) 100-01-04', '05.05.2020', 'Разрабатывает визуальный контент, создаёт макеты сайтов и рекламных материалов.', 3, 3],
        ['Попов', 'Артём', 'Владимирович', 'a.popov@staff.ru', '+7 (911) 100-01-05', '12.06.2020', 'Создаёт дизайн интерфейсов, логотипы и графические элементы для маркетинговых кампаний.', 3, 4],

        // SEO-специалисты (2) - Маркетинг (2)
        ['Васильев', 'Никита', 'Андреевич', 'n.vasilev@staff.ru', '+7 (911) 100-01-06', '18.07.2020', 'Оптимизирует сайты для поисковых систем, анализирует трафик и повышает позиции в выдаче.', 4, 5],
        ['Соколов', 'Максим', 'Игоревич', 'm.sokolov@staff.ru', '+7 (911) 100-01-07', '25.08.2020', 'Проводит семантический анализ, настраивает контекстную рекламу и улучшает SEO-показатели.', 4, 6],

        // SMM-менеджеры (2) - Маркетинг (2)
        ['Михайлов', 'Даниил', 'Павлович', 'd.mihajlov@staff.ru', '+7 (911) 100-01-08', '02.09.2020', 'Ведёт социальные сети компании, создаёт контент и взаимодействует с аудиторией.', 5, 7],
        ['Новиков', 'Егор', 'Олегович', 'e.novikov@staff.ru', '+7 (911) 100-01-09', '10.10.2020', 'Разрабатывает SMM-стратегию, запускает рекламные кампании и анализирует вовлечённость.', 5, 8],

        // Главный бухгалтер (1) - Финансы (3)
        ['Фёдоров', 'Кирилл', 'Романович', 'k.fedorov@staff.ru', '+7 (911) 100-01-10', '17.11.2020', 'Возглавляет бухгалтерию, контролирует финансовую отчётность и налоговые платежи.', 6, 9],

        // Бухгалтеры (2) - Финансы (3)
        ['Морозова', 'Анна', 'Дмитриевна', 'a.morozova@staff.ru', '+7 (911) 100-01-11', '23.12.2020', 'Ведёт учёт финансовых операций, рассчитывает заработную плату и готовит первичную документацию.', 7, 10],
        ['Волкова', 'Екатерина', 'Андреевна', 'e.volkova@staff.ru', '+7 (911) 100-01-12', '05.01.2021', 'Обрабатывает счета-фактуры, ведёт налоговый учёт и подготавливает отчётность для проверки.', 7, 11],

        // Frontend-разработчики (2) - IT (4)
        ['Алексеева', 'Мария', 'Сергеевна', 'm.alekseeva@staff.ru', '+7 (911) 100-01-13', '14.02.2021', 'Разрабатывает пользовательские интерфейсы, верстает страницы и реализует интерактивные элементы.', 8, 12],
        ['Лебедева', 'Ольга', 'Владимировна', 'o.lebedeva@staff.ru', '+7 (911) 100-01-14', '22.03.2021', 'Создаёт адаптивные веб-приложения, оптимизирует производительность и улучшает UX.', 8, 13],

        // Backend-разработчики (2) - IT (4)
        ['Семёнова', 'Дарья', 'Николаевна', 'd.semenova@staff.ru', '+7 (911) 100-01-15', '30.04.2021', 'Создаёт серверную логику приложений, проектирует базы данных и API.', 9, 14],
        ['Егорова', 'Полина', 'Александровна', 'p.egorova@staff.ru', '+7 (911) 100-01-16', '08.05.2021', 'Разрабатывает микросервисы, интегрирует внешние системы и обеспечивает безопасность данных.', 9, 15],

        // Системный администратор (1) - IT (4)
        ['Павлова', 'Виктория', 'Игоревна', 'v.pavlova@staff.ru', '+7 (911) 100-01-17', '16.06.2021', 'Обслуживает компьютерную технику, настраивает сети и обеспечивает безопасность инфраструктуры.', 10, 16],

        // Рекрутеры (2) - HR (5)
        ['Козлова', 'Софья', 'Дмитриевна', 's.kozlova@staff.ru', '+7 (911) 100-01-18', '24.07.2021', 'Ищет и подбирает кандидатов на вакантные позиции, проводит собеседования.', 11, 17],
        ['Степанова', 'Алиса', 'Максимовна', 'a.stepanova@staff.ru', '+7 (911) 100-01-19', '01.08.2021', 'Организует процесс найма, оценивает кандидатов и ведёт кадровый документооборот.', 11, 18],

        // Сорсер (1) - HR (5)
        ['Николаева', 'Елизавета', 'Романовна', 'e.nikolaeva@staff.ru', '+7 (911) 100-01-20', '09.09.2021', 'Занимается поиском кандидатов в открытых источниках и формирует базу потенциальных соискателей.', 12, 19]
    ];

    // Записывает тестовые отделы
    for (const dep of testDepartaments) {
        await db.run(departamentQueries.create, dep);
    }
    console.log('Тестовые отделы записаны');

    // Записывает тестовые должности
    for (const post of testPosts) {
        await db.run(postQueries.create, post);
    }
    console.log('Тестовые должности записаны');

    const imgIds: (number | null)[] = []
    // Записывает тестовые фотографии
    for (const filename of testImgs) {
        const id = await seedImg(filename)
        imgIds.push(id)
    }
    console.log('Тестовые фотографии записаны');

    // Записывает тестовых сотрудников
    for (const emp of testEmployees) {
        const imgIndex = (emp[8] ?? null) as number
        const realImgId = imgIds[imgIndex] ?? null

        const empData: EmployeeSeedRow = [...emp]
        empData[8] = realImgId
        await db.run(employeeQueries.create, empData);
    }
    console.log('Тестовые сотрудники записаны');

    console.log('Seed-данные вставлены');
}

//Авторизация

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            res.status(400).json({ error: 'Укажите логин и пароль' });
            return;
        }

        const account = await db.get(accountQueries.getByLogin, [login]);

        if (!account) {
            res.status(401).json({ error: 'Неверный логин или пароль' });
            return;
        }

        const expectedHash = hashPassword(password, account.salt);

        if (expectedHash !== account.hash) {
            res.status(401).json({ error: 'Неверный логин или пароль' });
            return;
        }

        const token = generateToken();
        sessions.set(token, { employeeId: account.employee_id, expiresAt: Date.now() + SESSION_TTL_MS });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка авторизации' });
    }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            res.status(400).json({ error: 'Укажите логин и пароль' });
            return;
        }

        const existing = await db.get(accountQueries.getByLogin, [login]);

        if (existing) {
            res.status(409).json({ error: 'Логин уже занят' });
            return;
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(password, salt);
        await db.run(accountQueries.create, [login, hash, salt, null]);

        res.status(201).json({ message: 'Аккаунт создан' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

//Маршруты сотрудников

app.get('/api/employees', async (req: Request, res: Response) => {
    try {
        const rows = await db.all(employeeQueries.getAll);
        res.json(rows.map(mapEmployee));
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения сотрудников', err });
    }
});

app.get('/api/employees/export/csv', requireAuth, async (req: Request, res: Response) => {
    try {
        const rows = await db.all(employeeQueries.getAll);
        const employees = rows.map(mapEmployee);

        const headers = ['ID', 'Фамилия', 'Имя', 'Отчество', 'Должность', 'Отдел', 'Email', 'Телефон', 'Дата приёма', 'Описание'];

        const escape = (val: any) => {
            const str = val == null ? '' : String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        };

        const lines = [
            headers.join(','),
            ...employees.map(e => [
                e.id,
                e.lastname,
                e.firstname,
                e.middlename,
                e.post,
                e.departament,
                e.email,
                e.phone,
                e.hireDate,
                e.bio
            ].map(escape).join(','))
        ];

        const csv = '﻿' + lines.join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка экспорта' });
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
    interface body {
        firstname: string,
        lastname: String,
        middlename: String,
        email: String,
        phone: String,
        date_admission: String,
        description: String,
        departament_id: number,
        post_id: number,
        image_id: number;
    }
    try {
        const { firstname, lastname, middlename, email, phone, date_admission, description, departament_id, post_id, image_id } = req.body as body

        await db.run(employeeQueries.update, [
            firstname,
            lastname,
            middlename,
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
    return;
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

app.get('/api/departaments', async (req: Request, res: Response) => {
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