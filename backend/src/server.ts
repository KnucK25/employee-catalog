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
import { rootQueries } from './database/queries/rootQueries';

const app = express();
app.use(express.json());

const PROTECTED_EMPLOYEE_ID = 1; // ID первого администратора (создается при seed)


const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});


// Разрешаем запросы с любого источника — иначе браузер опрокинет
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // ✅ Добавили кастомные заголовки
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Employee-Data, Size-File');

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
});

//Отдаём HTML/CSS/JS фронта
app.use('/css', express.static(path.join(__dirname, '../../frontend/css')));

app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));

app.use('/img', express.static(path.join(__dirname, '../../frontend/img')));

app.use(
    '/assets',
    express.static(path.join(__dirname, '../../frontend/assets'))
);

app.use(
    '/css',
    express.static(path.join(__dirname, '../../frontend/css'))
);

app.use(
    '/js',
    express.static(path.join(__dirname, '../../frontend/js'))
);

app.use(
    '/img',
    express.static(path.join(__dirname, '../../frontend/img'))
);
//Глобальная переменная для экземпляра БД
let db: Database;

// Токены хранятся в памяти: token → { employeeId, expiresAt }
const sessions = new Map<string, { employeeId: number | null; level: number; expiresAt: number }>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 часов
const ACCESS_LEVELS = {
    GUEST: 0,
    USER: 1,
    HR: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4
} as const;

function hashPassword(password: string, salt: string): string {
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

function decryptPassword(encryptedPassword: string): string {
    return crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        Buffer.from(encryptedPassword, 'base64')
    ).toString('utf8');
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

function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'Требуется авторизация' });
        return;
    }

    const session = sessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
        if (token) {
            sessions.delete(token);
        }

        res.status(401).json({ error: 'Сессия истекла, войдите снова' });
        return;
    }

    if (session.level < ACCESS_LEVELS.HR) {
        res.status(403).json({ error: 'Недостаточно прав' });
        return;
    }

    next();
}

function getCookieToken(req: Request): string | null {
    const cookie = req.headers.cookie;

    if (!cookie) {
        return null;
    }

    const cookies = cookie.split(';').map(c => c.trim());

    for (const item of cookies) {
        const [name, value] = item.split('=');

        if (name === 'authToken') {
            return value;
        }
    }

    return null;
}

function requirePageLevel(minLevel: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = getCookieToken(req);

        if (!token) {
            res.redirect('/');
            return;
        }

        const session = sessions.get(token);

        if (!session || session.expiresAt < Date.now()) {
            if (token) {
                sessions.delete(token);
            }

            res.clearCookie('authToken');
            res.redirect('/');
            return;
        }

        if (session.level < minLevel) {
            res.redirect('/');
            return;
        }

        next();
    };
}

interface getEmployee {
    id: number,
    firstname: string,
    lastname: string,
    middlename: string,
    post_name: string,
    departament_name: string,
    departament_id: number,
    post_id: number,
    email: string,
    phone: string,
    date_admission: string,
    description: string,
    image_id: number | null
}

interface setEmployee {
    id?: number,
    firstname: string,
    lastname: string,
    middlename: string,
    phone: string,
    email: string,
    description?: string,
    date_admission?: string,
    post_id: number,
    image_id: number | null
}

interface departaments {
    id: number,
    name: string
}

interface post {
    id: number,
    name: string,
    departament_id: number
}

//Переводим строку из базы к формату фронта
function mapEmployee(row: getEmployee) {
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

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class DataCache {
    private employees: CacheEntry<Array<ReturnType<typeof mapEmployee>>> | null = null
    private departaments: CacheEntry<Array<departaments>> | null = null
    private posts: CacheEntry<Array<post>> | null = null

    private TTL = 60 * 1000; //Устаревание через минуту

    async getEmployees(): Promise<Array<ReturnType<typeof mapEmployee>>> {
        if (this.employees && this.employees.expiresAt > Date.now()) {
            return this.employees.data
        }

        const rows: Array<getEmployee> = await db.all(employeeQueries.getAll)
        const data = rows.map(mapEmployee)

        this.employees = {
            data,
            expiresAt: Date.now() + this.TTL
        }

        return data
    }

    async getDepartaments(): Promise<Array<departaments>> {
        if (this.departaments && this.departaments.expiresAt > Date.now()) {
            return this.departaments.data
        }

        const data = await db.all(departamentQueries.getAll)

        this.departaments = {
            data,
            expiresAt: Date.now() + this.TTL
        }

        return data
    }

    async getPosts(): Promise<Array<post>> {
        if (this.posts && this.posts.expiresAt > Date.now()) {
            return this.posts.data
        }

        const data = await db.all(postQueries.getAll)

        this.posts = {
            data,
            expiresAt: Date.now() + this.TTL
        }

        return data
    }

    async getEmployeeById(id: number) {
        const employees = await this.getEmployees()
        return employees.find(e => e.id === id)
    }

    async getDepartamentById(id: number) {
        const departaments = await this.getDepartaments()
        return departaments.find(d => d.id === id)
    }

    async getPostById(id: number) {
        const posts = await this.getPosts()
        return posts.find(p => p.id === id)
    }

    async departamentExistByName(name: string) {
        const departaments = await this.getDepartaments()
        const departament = departaments.find(d => d.name === name)
        return departament?.id
    }

    async postExistByName(name: string) {
        const posts = await this.getPosts()
        const post = posts.find(p => p.name === name)
        return post?.id
    }

    invalidateEmployees(): void {
        this.employees = null
    }

    invalidateDepartaments(): void {
        this.departaments = null
    }

    invalidatePosts(): void {
        this.posts = null
    }

    invalidateAll(): void {
        this.employees = null
        this.departaments = null
        this.posts = null
    }
}

const dataCache = new DataCache()

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

    const adminLogin = 'admin@admin';
    const adminPassword = 'admin123';

    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = hashPassword(adminPassword, adminSalt);

    await db.run(accountQueries.create, [
        adminLogin,
        adminHash,
        adminSalt,
        1
    ]);

    await db.run(rootQueries.create, [
        1,
        ACCESS_LEVELS.SUPER_ADMIN
    ]);

    console.log('Стартовый администратор создан: login admin@admin, password admin123');

    console.log('Seed-данные вставлены');
}

// SSE эндпоинт для уведомлений клиентов
// Хранилище подключённых SSE-клиентов
const sseClients = new Set<Response>();

// ✅ Функция отправки события с проверкой активности клиентов
function broadcastEvent(eventType: string, data?: any) {
    const message = {
        type: eventType,
        data: data || {},
        timestamp: Date.now()
    };
    const payload = `data: ${JSON.stringify(message)}\n\n`;

    sseClients.forEach(client => {
        try {
            // Проверяем, что соединение ещё открыто
            if (!client.writable) {
                sseClients.delete(client);
                return;
            }
            client.write(payload);
        } catch (err) {
            // Если запись упала — удаляем мёртвого клиента
            console.log('🗑️ Удаляем мёртвого SSE-клиента');
            sseClients.delete(client);
        }
    });
}

// ✅ Периодический пинг каждые 15 секунд для обнаружения мёртвых соединений
setInterval(() => {
    sseClients.forEach(client => {
        try {
            // SSE-комментарий (начинается с ":") — игнорируется клиентом, но поддерживает TCP-соединение
            client.write(`: heartbeat\n\n`);
        } catch (err) {
            console.log('🗑️ Удаляем мёртвого клиента (heartbeat failed)');
            sseClients.delete(client);
        }
    });
}, 15000);

// ✅ SSE эндпоинт с корректной очисткой
app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Для Nginx/Railway прокси

    sseClients.add(res);
    console.log(`✅ SSE клиент подключён. Всего: ${sseClients.size}`);

    // Отправляем приветствие
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    // Локальный heartbeat для этого клиента
    const heartbeat = setInterval(() => {
        try {
            res.write(`: ping\n\n`);
        } catch {
            clearInterval(heartbeat);
        }
    }, 15000);

    // ✅ При закрытии соединения — очищаем
    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
        console.log(`❌ SSE клиент отключён. Осталось: ${sseClients.size}`);
    });

    // На всякий случай — обработчик ошибки
    req.on('error', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
    });
});

//Авторизация
app.get('/profile.html', requirePageLevel(1), (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/profile.html'));
});

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/index.html', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/catalog.html', requirePageLevel(1), (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/catalog.html'));
});

app.get('/card.html', requirePageLevel(1), (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/card.html'));
});

app.get('/adminPanel.html', requirePageLevel(2), (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/adminPanel.html'));
});

app.get('/accessPanel.html', requirePageLevel(2), (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/accessPanel.html'));
});

app.get('/api/auth/public-key', (req: Request, res: Response) => {
    res.json({
        publicKey
    });
});

// Проверка актуальности токена
app.get('/api/auth/me', (req: Request, res: Response) => {
    // Пробуем получить токен из Authorization header
    let token: string | null | undefined = req.headers['authorization']?.replace('Bearer ', '');

    // Если нет — пробуем из cookie
    if (!token) {
        token = getCookieToken(req);
    }

    if (!token) {
        res.status(401).json({ error: 'Требуется авторизация' });
        return;
    }

    const session = sessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
        if (token) sessions.delete(token);
        res.clearCookie('authToken');  // Очищаем cookie при истечении
        res.status(401).json({ error: 'Сессия истекла' });
        return;
    }

    res.json({
        employeeId: session.employeeId,
        level: session.level,
        expiresAt: session.expiresAt
    });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { login, encryptedPassword } = req.body;

        if (!login || !encryptedPassword) {
            res.status(400).json({ error: 'Укажите логин и пароль' });
            return;
        }

        const account = await db.get(accountQueries.getByLogin, [login]);

        if (!account) {
            res.status(401).json({ error: 'Неверный логин или пароль' });
            return;
        }

        let password: string;

        try {
            password = decryptPassword(encryptedPassword);
        } catch {
            res.status(400).json({ error: 'Ошибка расшифровки пароля' });
            return;
        }

        const expectedHash = hashPassword(password, account.salt);

        if (expectedHash !== account.hash) {
            res.status(401).json({ error: 'Неверный логин или пароль' });
            return;
        }

        let level = 0;

        if (account.employee_id) {
            const root = await db.get(rootQueries.getByEmployeeId, [account.employee_id]);
            level = root?.level ?? 1;
        }

        const token = generateToken();

        sessions.set(token, {
            employeeId: account.employee_id,
            level,
            expiresAt: Date.now() + SESSION_TTL_MS
        });

        res.cookie('authToken', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: SESSION_TTL_MS
        });

        res.json({
            token,
            employeeId: account.employee_id,
            level
        });
        // Никогда не произойдет
        // res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка авторизации' });
    }
});

app.post('/api/auth/register', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { login, encryptedPassword, employee_id, level } = req.body;

        if (!login || !encryptedPassword || !employee_id || level === undefined) {
            res.status(400).json({ error: 'Укажите логин, пароль, id сотрудника и уровень прав' });
            return;
        }

        const token = req.headers['authorization']?.replace('Bearer ', '');
        const session = token ? sessions.get(token) : null;

        if (!session) {
            res.status(401).json({ error: 'Сессия не найдена' });
            return;
        }

        const newLevel = Number(level);

        if (
            Number.isNaN(newLevel) ||
            newLevel < ACCESS_LEVELS.USER ||
            newLevel >= ACCESS_LEVELS.SUPER_ADMIN
        ) {
            res.status(400).json({ error: 'Уровень прав должен быть от 1 до 3' });
            return;
        }

        if (newLevel >= session.level) {
            res.status(403).json({ error: 'Нельзя создать аккаунт с уровнем равным или выше своего' });
            return;
        }

        const existing = await db.get(accountQueries.getByLogin, [login]);

        if (existing) {
            res.status(409).json({ error: 'Логин уже занят' });
            return;
        }

        let password: string;

        try {
            password = decryptPassword(encryptedPassword);
        } catch {
            res.status(400).json({ error: 'Ошибка расшифровки пароля' });
            return;
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(password, salt);

        await db.run(accountQueries.create, [
            login,
            hash,
            salt,
            employee_id
        ]);

        await db.run(rootQueries.create, [
            employee_id,
            newLevel
        ]);

        res.status(201).json({
            message: 'Аккаунт создан',
            employee_id,
            level: newLevel
        });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

//Маршруты аккаунтов

app.get('/api/accounts/by-employee/:employeeId', async (req: Request, res: Response) => {
    try {
        const row = await db.get(accountQueries.getByEmployeeId, [req.params.employeeId]);
        if (!row) {
            res.status(404).json({ error: 'Аккаунт не найден' });
            return;
        }
        res.json({ login: row.login });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения аккаунта' });
    }
});

app.put('/api/accounts/by-employee/:employeeId', async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;
        const employeeId = parseInt(req.params.employeeId as string);

        const account = await db.get(accountQueries.getByEmployeeId, [employeeId]);

        if (!account) {
            // Аккаунта нет — создаём
            if (!login || !password) {
                res.status(400).json({ error: 'Для создания аккаунта нужны логин и пароль' });
                return;
            }
            const existing = await db.get(accountQueries.getByLogin, [login]);
            if (existing) {
                res.status(409).json({ error: 'Логин уже занят' });
                return;
            }
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = hashPassword(password, salt);
            await db.run(accountQueries.create, [login, hash, salt, employeeId]);
        } else {
            // Аккаунт есть — обновляем только заполненные поля
            if (login) {
                const existing = await db.get(accountQueries.getByLogin, [login]);
                if (existing && existing.employee_id !== employeeId) {
                    res.status(409).json({ error: 'Логин уже занят' });
                    return;
                }
                await db.run(accountQueries.updateLogin, [login, employeeId]);
            }
            if (password) {
                const salt = crypto.randomBytes(16).toString('hex');
                const hash = hashPassword(password, salt);
                await db.run(accountQueries.updatePassword, [hash, salt, account.id]);
            }
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message ?? 'Ошибка обновления аккаунта' });
    }
});

app.get('/api/accounts', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const accounts = await db.all(accountQueries.getAll);
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения аккаунтов' });
    }
});

app.put('/api/accounts/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            res.status(400).json({ error: 'Невалидный параметр' });
            return;
        }
        const id = Number(req.params.id);
        const { login, password, access_level } = req.body;

        const account = await db.get(accountQueries.getById, [id]);
        if (!account) {
            res.status(404).json({ error: 'Аккаунт не найден' });
            return;
        }

        if (login) {
            const existing = await db.get(accountQueries.getByLogin, [login]);
            if (existing && existing.id !== id) {
                res.status(409).json({ error: 'Логин уже занят' });
                return;
            }
            await db.run(accountQueries.updateLoginById, [login, id]);
        }

        if (password) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = hashPassword(password, salt);
            await db.run(accountQueries.updatePasswordById, [hash, salt, id]);
        }

        if (access_level !== undefined && account.employee_id) {
            await db.run(rootQueries.updateLevel, [Number(access_level), account.employee_id]);
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message ?? 'Ошибка обновления аккаунта' });
    }
});

app.delete('/api/accounts/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            res.status(400).json({ error: 'Невалидный параметр' });
            return;
        }
        const id = Number(req.params.id);

        const account = await db.get(accountQueries.getById, [id]);
        if (!account) {
            res.status(404).json({ error: 'Аккаунт не найден' });
            return;
        }

        if (account.employee_id) {
            await db.run(rootQueries.removeByEmployeeId, [account.employee_id]);
        }
        await db.run(accountQueries.removeById, [id]);

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message ?? 'Ошибка удаления аккаунта' });
    }
});

//Маршруты сотрудников

app.get('/api/employees', async (req: Request, res: Response) => {
    try {
        const employees = await dataCache.getEmployees()
        res.status(200).json(employees)
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения сотрудников', err });
    }
});

app.get('/api/employees/export/csv', requireAuth, async (req: Request, res: Response) => {
    try {
        const employees = await dataCache.getEmployees()

        const delimiter = ';';
        
        const headers = ['ID', 'Фамилия', 'Имя', 'Отчество', 'Должность', 'Отдел', 'Email', 'Телефон', 'Дата приёма', 'Описание'];

        const escape = (val: any) => {
            const str = val == null ? '' : String(val);
            if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const lines = [
            headers.join(delimiter),
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
            ].map(escape).join(delimiter))
        ];

        // Добавляем BOM для правильного отображения кириллицы в Excel
        const BOM = '\uFEFF';
        const csvContent = lines.join('\n');
        const csvWithBom = BOM + csvContent;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(csvWithBom);
        
    } catch (err) {
        console.error('Ошибка экспорта CSV:', err);
        res.status(500).json({ error: 'Ошибка экспорта' });
    }
});

// Не используется
// app.get('/api/employees/search', async (req: Request, res: Response) => {
//     try {
//         const q = `%${req.query.q ?? ''}%`;
//         const rows = await db.all(employeeQueries.search, { search: q });
//         res.json(rows.map(mapEmployee));
//     } catch (err) {
//         res.status(500).json({ error: 'Ошибка поиска' });
//     }
// });

app.get('/api/employees/:id', async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            return res.status(404).json({ error: 'Невалидный параметр' })
            // Перенаправлять на 404 стр?
        }
        const id = Number(req.params.id)
        const employee = await dataCache.getEmployeeById(id)


        if (!employee) {
            res.status(404).json({ error: 'Сотрудник не найден' });
            return;
        }

        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения сотрудника' });
    }
});

app.post('/api/employees', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { firstname, lastname, middlename, email, phone, date_admission, description, post_id, image_id } = req.body as setEmployee;

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

        dataCache.invalidateEmployees()
        broadcastEvent('employees.updated')

        if (!result.lastID) {
            res.status(500).json({ error: "Запрос на создание был отправлен, но создания не произошло" })
            return
        }

        const employee = await dataCache.getEmployeeById(result.lastID)

        res.status(201).json({ ...employee, message: "Сотрудник успешно создан" });
    } catch (err: any) {
        res.status(400).json({ error: err.message ?? 'Ошибка создания' });
    }
});

app.put('/api/employees/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            return res.status(404).json({ error: 'Невалидный параметр' })
        }
        const id = Number(req.params.id)

        const { firstname, lastname, middlename, email, phone, date_admission, description, post_id, image_id } = req.body as setEmployee

        await db.run(employeeQueries.update, [
            firstname,
            lastname,
            middlename,
            email,
            phone,
            date_admission,
            description ?? '',
            post_id,
            image_id ?? null,
            id
        ]);
        dataCache.invalidateEmployees()
        broadcastEvent('employees.updated', { id })
        const employee = await dataCache.getEmployeeById(id)

        if (!employee) {
            res.status(500).json({ error: 'Сотрудник был обновлен, но не был найден' });
            return;
        }

        res.json({ ...employee, message: "Сотрудник успешно сохранен" });
    } catch (err: any) {
        res.status(400).json({ error: err.message ?? 'Ошибка обновления' });
    }
});

app.delete('/api/employees/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            return res.status(404).json({ error: 'Невалидный параметр' })
        }
        const id = Number(req.params.id)
        await db.run(employeeQueries.remove, [id]);
        dataCache.invalidateEmployees()
        broadcastEvent('employees.updated', { id })
        res.status(200).json({ message: "Сотрудник удален" });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления' });
    }
});

// Обновление сотрудника + загрузка нового фото одним запросом
app.put('/api/employees-and-photo/:id',
    requireAuth,
    requireAdmin,
    express.raw({ type: 'image/*', limit: '5mb' }),
    async (req: Request, res: Response) => {
        try {
            if (!/^\d+$/.test(req.params.id as string)) {
                return res.status(404).json({ error: 'Невалидный параметр' })
            }
            const id = Number(req.params.id)

            const existing = await dataCache.getEmployeeById(id)
            if (!existing) {
                res.status(404).json({ error: 'Сотрудник не найден' });
                return;
            }

            const employeeHeader = req.headers['x-employee-data'];
            if (!employeeHeader) {
                res.status(400).json({ error: 'Отсутствуют данные сотрудника (X-Employee-Data)' });
                return;
            }

            let employeeData: setEmployee;
            try {
                const decoded = decodeURIComponent(employeeHeader as string);
                employeeData = JSON.parse(decoded);
            } catch (e) {
                return res.status(400).json({ error: 'Некорректный JSON в X-Employee-Data' });
            }

            // Валидация бинарных данных
            const imageBuffer: Buffer = req.body;
            if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
                res.status(400).json({ error: 'Отсутствует файл изображения' });
                return;
            }

            const declaredSizeHeader = req.headers['size-file'];
            if (!declaredSizeHeader) {
                res.status(400).json({ error: 'Отсутствует заголовок Size-File' });
                return;
            }

            const declaredSize = parseInt(declaredSizeHeader as string, 10);
            if (isNaN(declaredSize)) {
                return res.status(400).json({ error: 'Некорректный размер файла в заголовке Size-File' });
            }

            const actualSize = imageBuffer.length;
            if (declaredSize !== actualSize) {
                return res.status(400).json({ error: `Несоответствие размера файла: заявлено ${declaredSize} байт, получено ${actualSize} байт.` });
            }

            const mimeType = (req.headers['content-type'] ?? '').toLowerCase();
            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(mimeType)) {
                return res.status(400).json({ error: 'Недопустимый формат изображения' });
            }

            if (actualSize > 5 * 1024 * 1024) {
                return res.status(400).json({ error: 'Файл слишком большой (макс. 5 МБ)' });
            }

            const dbMimeType = mimeType.replace('image/', '');

            let finalImageId: number | null;

            if (!employeeData.image_id) {
                // Создаём новую запись, если у сотрудника нет фото
                const imgResult = await db.run(imageQueries.create, [
                    imageBuffer,
                    dbMimeType,
                    actualSize
                ]);
                finalImageId = imgResult.lastID ?? null;
            } else {
                // Обновляем существующую запись, если у сотрудника уже была фотография
                await db.run(imageQueries.update, [
                    imageBuffer,
                    dbMimeType,
                    actualSize,
                    employeeData.image_id
                ]);
                finalImageId = employeeData.image_id;
            }

            // Обновляем сотрудника
            await db.run(employeeQueries.update, [
                employeeData.firstname,
                employeeData.lastname,
                employeeData.middlename ?? '',
                employeeData.email,
                employeeData.phone,
                employeeData.date_admission ?? existing.hireDate,
                employeeData.description ?? '',
                employeeData.post_id,
                finalImageId,  // ✅ Теперь всегда корректный ID
                id
            ]);

            dataCache.invalidateEmployees()
            broadcastEvent('employees.updated', { id })

            const employee = await dataCache.getEmployeeById(id)

            if (!employee) {
                return res.status(500).json({ error: 'Сотрудник обновлён, но не найден после сохранения' });
            }

            res.json({ ...employee, message: 'Сотрудник и фото успешно обновлены' });

        } catch (err: any) {
            console.error('Ошибка в /api/employees-and-photo/:id', err);
            res.status(500).json({ error: err.message ?? 'Ошибка сервера' });
        }
    });

//Маршруты отделов

app.get('/api/departaments', async (req: Request, res: Response) => {
    try {
        const departaments = await dataCache.getDepartaments()
        res.json(departaments);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения отделов' });
    }
});

app.post('/api/departaments', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name } = req.body as { name: string };

        if (name.trim() === '') {
            return res.status(400).json({ error: 'Не введено название отдела' })
        }

        const exist = await dataCache.departamentExistByName(name)
        if (exist) return res.status(409).json({ error: 'Такой отдел уже существует' })

        const result = await db.run(departamentQueries.create, [name])

        dataCache.invalidateDepartaments()
        broadcastEvent('departments.updated');

        if (!result.lastID) {
            return res.status(500).json({ error: "Строка не была создана" })
        }

        const departament = await dataCache.getDepartamentById(result.lastID)
        if (!departament) {
            return res.status(500).json({ error: "Отдел создан, но не найден" })
        }
        return res.status(201).json(departament)
    } catch (err: any) {
        return res.status(500).json({ error: err.message ?? 'Ошибка сервера' })
    }
})

app.delete('/api/departaments/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            return res.status(404).json({ error: 'Невалидный параметр' })
        }
        const id = Number(req.params.id)
        const exist = await dataCache.getDepartamentById(id)
        if (!exist) return res.status(404).json({ error: "Не найден отдел с таким id" })

        const posts = await dataCache.getPosts()
        const deleted_posts = posts.filter(p => p.departament_id === id)

        const deleted_posts_ids = new Set(deleted_posts.map(p => p.id))

        const employees = await dataCache.getEmployees()
        const deleted_employees = employees.filter(e => deleted_posts_ids.has(e.post_id))

        await db.run(departamentQueries.remove, [id])
        dataCache.invalidateAll()
        broadcastEvent('departments.updated');
        broadcastEvent('posts.updated')
        broadcastEvent('employees.updated')
        const existAfterDelete = await dataCache.getDepartamentById(id)

        if (existAfterDelete) {
            return res.status(500).json({ error: "Запрос на удаление был отправлен, но удаления не произошло" })
        }

        return res.status(200).json({ message: `Отдел с id ${id} был удален`, deleted_posts, deleted_employees })
    } catch (error: any) {
        return res.status(500).json({ error: error.message ?? "Ошибка сервера" })
    }
})

//Маршруты должностей

app.get('/api/posts', async (req: Request, res: Response) => {
    try {
        const posts = await dataCache.getPosts()
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения должностей' });
    }
});

app.post('/api/posts', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { departament_id, name } = req.body as post
        if (name.trim() === '') return res.status(400).json({ error: "Не введено название должности" })

        const exist = await dataCache.postExistByName(name)
        if (exist) return res.status(409).json({ error: "Такая должность уже существует" })

        const result = await db.run(postQueries.create, [departament_id, name])
        dataCache.invalidatePosts()
        broadcastEvent('posts.updated')
        if (!result.lastID) {
            return res.status(500).json({ message: "Новая должность была создана, но не была найдена" })
        }
        const post = await dataCache.getPostById(result.lastID)
        if (!post) {
            return res.status(500).json({ error: "Должность создана, но не найдена" })
        }
        return res.status(201).json(post)
    } catch (error: any) {
        return res.status(500).json({ error: error.message ?? 'Ошибка сервера' })
    }
})

app.delete('/api/posts/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            return res.status(404).json({ error: 'Невалидный параметр' })
        }
        const id = Number(req.params.id)
        const exist = await dataCache.getPostById(id)

        if (!exist) return res.status(404).json({ error: `Не найдена должность с id ${id}` })

        const employees = await dataCache.getEmployees()
        const deleted_employees = employees.filter(e => e.post_id === id)

        await db.run(postQueries.remove, [id])
        dataCache.invalidateAll()
        broadcastEvent('posts.updated')
        broadcastEvent('employees.updated')
        const existAfterDelete = await dataCache.getPostById(id)

        if (existAfterDelete) return res.status(500).json({ error: "Запрос на удаление был отправлен, но удаления не произошло" })

        return res.status(200).json({ message: `Должность с id ${id} была удалена`, deleted_employees })
    } catch (error: any) {
        return res.status(500).json({ error: error.message ?? "Ошибка сервера" })
    }
})

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


// ВМЕСТО существующего DELETE /api/employees/:id

app.delete('/api/employees/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            return res.status(404).json({ error: 'Невалидный параметр' })
        }
        const id = Number(req.params.id)
        
        // Получаем текущего пользователя из токена
        const token = req.headers['authorization']?.replace('Bearer ', '');
        const session = token ? sessions.get(token) : null;
        const currentEmployeeId = session?.employeeId;
        
        // Запрещаем удаление первого администратора (id = 1)
        if (id === PROTECTED_EMPLOYEE_ID) {
            return res.status(403).json({ 
                error: 'Невозможно удалить первого администратора системы' 
            });
        }
        
        // Запрещаем удаление самого себя
        if (currentEmployeeId === id) {
            return res.status(403).json({ 
                error: 'Вы не можете удалить самого себя' 
            });
        }
        
        await db.run(employeeQueries.remove, [id]);
        dataCache.invalidateEmployees()
        broadcastEvent('employees.updated', { id })
        res.status(200).json({ message: "Сотрудник удален" });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления' });
    }
});

// ВМЕСТО существующего DELETE /api/accounts/:id

app.delete('/api/accounts/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        if (!/^\d+$/.test(req.params.id as string)) {
            res.status(400).json({ error: 'Невалидный параметр' });
            return;
        }
        const id = Number(req.params.id);

        const account = await db.get(accountQueries.getById, [id]);
        if (!account) {
            res.status(404).json({ error: 'Аккаунт не найден' });
            return;
        }
        
        // Получаем текущего пользователя из токена
        const token = req.headers['authorization']?.replace('Bearer ', '');
        const session = token ? sessions.get(token) : null;
        const currentEmployeeId = session?.employeeId;
        
        // Запрещаем удаление аккаунта первого администратора (employee_id = 1)
        if (account.employee_id === PROTECTED_EMPLOYEE_ID) {
            return res.status(403).json({ 
                error: 'Невозможно удалить аккаунт первого администратора системы' 
            });
        }
        
        // Запрещаем удаление своего собственного аккаунта
        if (currentEmployeeId === account.employee_id) {
            return res.status(403).json({ 
                error: 'Вы не можете удалить свой собственный аккаунт' 
            });
        }

        if (account.employee_id) {
            await db.run(rootQueries.removeByEmployeeId, [account.employee_id]);
        }
        await db.run(accountQueries.removeById, [id]);

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message ?? 'Ошибка удаления аккаунта' });
    }
});

startServer().catch(console.error)