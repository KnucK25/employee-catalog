import { Database } from "sqlite";

export type CreateEmployeeData = {
    first_name: string;
    last_name: string;
    position: string;
    email?: string;
    phone?: string;
    department_id?: number;
};

export async function createEmployee(db: Database, data: CreateEmployeeData) {
    const result = await db.run(`
        INSERT INTO employees (
        first_name,
        last_name,
        position,
        email,
        phone,
        department_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.first_name,
            data.last_name,
            data.position,
            data.email ?? null,
            data.phone ?? null,
            data.department_id ?? null,
        ]
    );

    return result.lastID;
}

export async function getEmployees(db: Database) {
    return db.all(`
        SELECT 
            employees.id,
            employees.first_name,
            employees.last_name,
            employees.position,
            employees.email,
            employees.phone,
            employees.created_at,
            employees.updated_at,
            departments.name AS department
        FROM employees
        LEFT JOIN departments
        ON employees.department_id = departments.id
        `);
}