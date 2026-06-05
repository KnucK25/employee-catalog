const API_BASE = 'http://localhost:3000';

let employees = [];

async function loadEmployees() {
    try {
        const res = await fetch(`${API_BASE}/api/employees`);

        if (!res.ok) {
            throw new Error('Ошибка сервера');
        }

        employees = await res.json();
        renderEmployees();
        loadDepartments();
    } catch (err) {
        const container = document.getElementById('employeesContainer');

        if (container) {
            container.innerHTML = `
                <div class="row">
                    <div class="col-12 text-center py-4">
                        <p class="text-danger">Не удалось загрузить данные. Проверьте, запущен ли сервер.</p>
                    </div>
                </div>`;
        }
    }
}

async function loadDepartments() {
    try {
        const res = await fetch(`${API_BASE}/api/departments`);
        const departments = await res.json();
        const menu = document.getElementById('departmentMenu');

        if (!menu) {
            return;
        }

        departments.forEach(dep => {
            const li = document.createElement('li');
            li.innerHTML = `<a class="dropdown-item" href="#" onclick="filterByDepartment('${dep.name}')">${dep.name}</a>`;
            menu.appendChild(li);
        });
    } catch (err) {
        console.warn('Не удалось загрузить отделы');
    }
}

    // отладка
    console.log('Скрипт загрузился');

    function createEmployeeRow(employee) {
        const row = document.createElement('div');
        row.className = 'row admin-employee-row align-items-center';
        row.setAttribute('data-id', employee.id);
        row.setAttribute('data-department', employee.department);
        row.setAttribute('data-name', employee.name.toLowerCase());
        row.setAttribute('data-position', employee.position.toLowerCase());

        row.innerHTML = `
            <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0">
                <img src="${employee.avatar || 'img/team1.png'}" alt="${employee.name}" class="admin-employee-photo me-3">
                <div>
                    <div class="admin-employee-name">${employee.name}</div>
                    <div class="admin-employee-text">ID: ${String(employee.id).padStart(4, '0')}</div>
                </div>
            </div>
            <div class="col-md-3 mb-2 mb-md-0">
                <div class="admin-employee-name" style="font-size: 0.9rem;">${employee.department}</div>
                <div class="admin-employee-text">${employee.position}</div>
            </div>
            <div class="col-md-3 mb-3 mb-md-0">
                <div class="admin-employee-text">${employee.phone}</div>
                <div class="admin-employee-text">${employee.email}</div>
            </div>
            <div class="col-md-2 d-flex gap-2 justify-content-md-end">
                <button class="btn btn-action-icon" title="Редактировать" onclick="editEmployee(${employee.id})">
                    <img src="img/button_00.png" alt="Ред." style="width: 20px; height: 20px;">
                </button>
                <button class="btn btn-action-icon" title="Удалить" onclick="deleteEmployee(${employee.id})">
                    <img src="img/button_01.png" alt="Уд." style="width: 20px; height: 20px;">
                </button>
            </div>
        `;

        console.log('Строка создана для:', employee.name);
        return row;
    }

    async function deleteEmployee(employeeId) {
        try {
            await fetch(`${API_BASE}/api/employees/${employeeId}`, { method: 'DELETE' });
        } catch (err) {
            console.warn('Ошибка удаления на сервере:', err);
        }

        const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);

        if (row) {
            row.remove();
        }

        const index = employees.findIndex(emp => emp.id === employeeId);

        if (index !== -1) {
            employees.splice(index, 1);
        }

        if (employees.length === 0) {
            const container = document.getElementById('employeesContainer');
            container.innerHTML = `
                <div class="row">
                    <div class="col-12 text-center py-4">
                        <p class="text-muted">Сотрудники не найдены</p>
                    </div>
                </div>
            `;
        }

        console.log(`Сотрудник ${employeeId} удалён. Осталось: ${employees.length}`);
    }

// Функция редактирования
function editEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);
    if (!row) return;

    row.innerHTML = `
        <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0">
            <img src="${employee.avatar || 'img/team1.png'}" alt="${employee.name}" class="admin-employee-photo me-3">
            <div class="w-100">
                <input type="text" class="form-control form-control-sm mb-1 edit-name" value="${employee.name}" placeholder="Имя">
                <input type="text" class="form-control form-control-sm mb-1 edit-position" value="${employee.position}" placeholder="Должность">
            </div>
        </div>
        <div class="col-md-3 mb-2 mb-md-0">
            <input type="text" class="form-control form-control-sm mb-1 edit-department" value="${employee.department}" placeholder="Отдел">
        </div>
        <div class="col-md-3 mb-3 mb-md-0">
            <input type="text" class="form-control form-control-sm mb-1 edit-phone" value="${employee.phone}" placeholder="Телефон">
            <input type="email" class="form-control form-control-sm edit-email" value="${employee.email}" placeholder="Email">
        </div>
        <div class="col-md-2 d-flex gap-2 justify-content-md-end">
            <button class="btn btn-success btn-sm" onclick="saveEmployee(${employeeId})" title="Сохранить">
                ✓
            </button>
            <button class="btn btn-secondary btn-sm" onclick="cancelEdit(${employeeId})" title="Отмена">
                ✕
            </button>
        </div>
    `;
}

// Сохранение изменений
async function saveEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);

    employee.name = row.querySelector('.edit-name').value.trim();
    employee.position = row.querySelector('.edit-position').value.trim();
    employee.department = row.querySelector('.edit-department').value.trim();
    employee.phone = row.querySelector('.edit-phone').value.trim();
    employee.email = row.querySelector('.edit-email').value.trim();

    // Разбиваем имя на части для отправки в API
    const nameParts = employee.name.split(' ');

    try {
        await fetch(`${API_BASE}/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstname: nameParts[0] ?? '',
                lastname: nameParts[1] ?? '',
                middlename: nameParts[2] ?? employee.middlename ?? '',
                email: employee.email,
                phone: employee.phone,
                date_admission: employee.hireDate,
                description: employee.bio ?? '',
                departament_id: employee.departament_id,
                post_id: employee.post_id,
                image_id: employee.image_id ?? null
            })
        });
    } catch (err) {
        console.warn('Ошибка сохранения на сервере:', err);
    }

    renderEmployees();
    console.log(`Сотрудник ${employeeId} обновлён`);
}

// Отмена редактирования
function cancelEdit(employeeId) {
    renderEmployees();
}

    function renderEmployees() {
        const container = document.getElementById('employeesContainer');
        console.log('Контейнер найден:', container ? 'да' : 'нет');

        if (!container) {
            console.error('Контейнер employeesContainer НЕ найден!');
            return;
        }

        const existingRows = container.querySelectorAll('.admin-employee-row');
        console.log('Старых строк найдено:', existingRows.length);
        existingRows.forEach(row => row.remove());

        if (!employees || !employees.length) {
            console.log('Нет данных для отображения');
            container.innerHTML = `
                <div class="row">
                    <div class="col-12 text-center py-4">
                        <p class="text-muted">Сотрудники не найдены или данные не загружены</p>
                    </div>
                </div>
            `;
            return;
        }

        employees.forEach(employee => {
            const row = createEmployeeRow(employee);
            container.appendChild(row);
        });

        console.log('Всего строк добавлено:', employees.length);
    }

function searchEmployees() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() ?? '';

    if (!query) {
        renderEmployees();
        return;
    }

    const filtered = employees.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.position.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query)
    );

    const container = document.getElementById('employeesContainer');
    if (!container) return;

    const existingRows = container.querySelectorAll('.admin-employee-row');
    existingRows.forEach(row => row.remove());
    filtered.forEach(emp => container.appendChild(createEmployeeRow(emp)));
}

function filterByDepartment(dept) {
    const btn = document.getElementById('departmentDropdown');

    if (btn) {
        btn.textContent = dept === 'all' ? 'Все отделы' : dept;
    }

    if (dept === 'all') {
        renderEmployees();
        return;
    }

    const filtered = employees.filter(e => e.department === dept);
    const container = document.getElementById('employeesContainer');

    if (!container) return;

    const existingRows = container.querySelectorAll('.admin-employee-row');
    existingRows.forEach(row => row.remove());
    filtered.forEach(emp => container.appendChild(createEmployeeRow(emp)));
}

    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM загружен, загружаем данные с сервера');
        loadEmployees();
    });
