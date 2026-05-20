import { openDatabase } from "./database/db";
import { createEmployee, getEmployees } from "./repositories/employee.repository";

async function main() {
    const db = await openDatabase();

    console.log("Работает")

    await db.run(`
        INSERT OR IGNORE INTO departments (name)
        VALUES (?)
        `, ["IT"]);

    const employeeId = await createEmployee(db, {
        first_name: "Anna",
        last_name: "Smirnova",
        position: "HR Manager",
        email: "anna@example.com",
        phone: "+79990000000",
        department_id: 1,
    });

    console.log("Создан сотрудник с id:", employeeId);

    const employees = await getEmployees(db);

    console.log("Employees:", employees);
}

main();