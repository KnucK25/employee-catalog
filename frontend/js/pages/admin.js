const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`

let employees = [];
let departmentsList = [];
let postsList = [];


async function loadPosts() {
    try {
        const res = await fetch(`${API_BASE}/api/posts`);
        postsList = await res.json();
    } catch (err) {
        console.warn('Не удалось загрузить должности');
    }
}

async function loadEmployees() {
    try {
        // Загружаем всё параллельно и ждём завершения
        const [employeesRes, departmentsRes, postsRes] = await Promise.all([
            fetch(`${API_BASE}/api/employees`),
            fetch(`${API_BASE}/api/departments`),
            fetch(`${API_BASE}/api/posts`)
        ]);
        
        if (!employeesRes.ok) throw new Error('Ошибка сервера');
        
        // Парсим все ответы
        employees = await employeesRes.json();
        departmentsList = await departmentsRes.json();
        postsList = await postsRes.json();
        
        // Теперь всё загружено, можно отрисовывать
        renderEmployees();
        populateDepartmentMenu(); // Отдельная функция для меню отделов
        
    } catch (err) {
        console.error('Ошибка загрузки:', err);
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

// Отдельная функция для заполнения меню фильтров
function populateDepartmentMenu() {
    const menu = document.getElementById('departmentMenu');
    if (!menu) return;
    menu.innerHTML = ''
    const allLi = document.createElement('li')
    allLi.innerHTML = `<a class="dropdown-item" href="#" onclick="filterByDepartment('all')">Все отделы</a>`;
    menu.appendChild(allLi);
    departmentsList.forEach(dep => {
        const li = document.createElement('li');
        li.innerHTML = `<a class="dropdown-item" href="#" onclick="filterByDepartment('${dep.name}')">${dep.name}</a>`;
        menu.appendChild(li);
    });
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
                    <img src="img/redact.png" alt="Ред." style="width: 20px; height: 20px;">
                </button>
                <button class="btn btn-action-icon" title="Удалить" onclick="deleteEmployee(${employee.id})">
                    <img src="img/delete.png" alt="Уд." style="width: 20px; height: 20px;">
                </button>
                <button class="btn btn-action-icon" title="Удалить" onclick="deleteEmployee(${employee.id})">
                    <img src="img/export.png" alt="Уд." style="width: 20px; height: 20px;">
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

    const deptOptions = (departmentsList || []).map(d => {
        const isSelected = String(d.id) === String(employee.departament_id) ? 'selected' : '';
        return `<option value="${d.id}" ${isSelected}>${d.name}</option>`;
    }).join('');

    const postOptions = (postsList || []).map(p => {
        const isSelected = String(p.id) === String(employee.post_id) ? 'selected' : '';
        return `<option value="${p.id}" ${isSelected}>${p.name}</option>`;
    }).join('');

    row.innerHTML = `
        <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0">
            <img src="${employee.avatar || 'img/team1.png'}" alt="${employee.name}" class="admin-employee-photo me-3">
            <div class="w-100">
            <input type="text" class="form-control form-control-sm border-light mb-1 edit-lastname" value="${employee.lastname || ''}" placeholder="Фамилия">
            <input type="text" class="form-control form-control-sm border-light mb-1 edit-firstname" value="${employee.firstname || ''}" placeholder="Имя">
                <input type="text" class="form-control form-control-sm border-light mb-1 edit-middlename" value="${employee.middlename || ''}" placeholder="Отчество">
            </div>
        </div>
        <div class="col-md-3 mb-2 mb-md-0">
            <!-- ДОБАВЛЕНО style="width: 100%;" -->
            <select class="form-select form-select-sm border-light mb-1 edit-department-id" style="width: 100%;">
                ${deptOptions}
            </select>
            <!-- ДОБАВЛЕНО style="width: 100%;" -->
            <select class="form-select form-select-sm border-light edit-post-id" style="width: 100%;">
                ${postOptions}
            </select>
        </div>
        <div class="col-md-3 mb-3 mb-md-0">
            <input type="text" class="form-control form-control-sm border-light mb-1 edit-phone" value="${employee.phone}" placeholder="Телефон">
            <input type="email" class="form-control form-control-sm border-light edit-email" value="${employee.email}" placeholder="Email">
        </div>
        <div class="col-md-2 d-flex gap-2 justify-content-md-end">
            <button class="btn btn-success btn-sm" onclick="saveEmployee(${employeeId})" title="Сохранить">✓</button>
            <button class="btn btn-secondary btn-sm" onclick="cancelEdit(${employeeId})" title="Отмена">✕</button>
        </div>
    `;
}

// Сохранение изменений
async function saveEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);

    // 1. Читаем ФИО из отдельных полей
    const lastname = row.querySelector('.edit-lastname').value.trim();
    const firstname = row.querySelector('.edit-firstname').value.trim();
    const middlename = row.querySelector('.edit-middlename').value.trim();

    // 2. Читаем ID напрямую из выпадающих списков (преобразуем в число)
    const departament_id = parseInt(row.querySelector('.edit-department-id').value);
    const post_id = parseInt(row.querySelector('.edit-post-id').value);

    const phone = row.querySelector('.edit-phone').value.trim();
    const email = row.querySelector('.edit-email').value.trim();

    const json_body = JSON.stringify({
        firstname: firstname,
        lastname: lastname,
        middlename: middlename,       // ✅ Отчество теперь сохраняется корректно
        email: email,
        phone: phone,
        date_admission: employee.hireDate,
        description: employee.bio ?? '',
        departament_id: departament_id, // ✅ Отправляется новый ID отдела
        post_id: post_id,               // ✅ Отправляется новый ID должности
        image_id: employee.image_id ?? null
    });

    try {
        const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: json_body
        });

        if (!res.ok) {
            const error = await res.json();
            alert('Ошибка сохранения: ' + (error.error || 'Неизвестная ошибка'));
            return;
        }
    } catch (err) {
        console.warn('Ошибка сохранения на сервере:', err);
        alert('Ошибка сети при сохранении');
        return;
    }

    // Перезагружаем данные, чтобы таблица обновилась с новыми значениями
    await loadEmployees();
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

    // Открытие модального окна
function openAddEntityModal() {
    document.getElementById('addEmployeeForm').style.display = 'none';
    document.getElementById('addDepartmentForm').style.display = 'none';
    document.getElementById('deleteDepartmentForm').style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('addEntityModal'));
    modal.show();
}

function showAddEmployeeForm() {
    document.getElementById('addEmployeeForm').style.display = 'block';
    document.getElementById('addDepartmentForm').style.display = 'none';
    document.getElementById('deleteDepartmentForm').style.display = 'none';
}

function showDepartmentForm() {
    document.getElementById('addEmployeeForm').style.display = 'none';
    document.getElementById('addDepartmentForm').style.display = 'block';
    document.getElementById('deleteDepartmentForm').style.display = 'none';
}

async function showDeleteDepartmentForm() {
    document.getElementById('addEmployeeForm').style.display = 'none';
    document.getElementById('addDepartmentForm').style.display = 'none';
    document.getElementById('deleteDepartmentForm').style.display = 'block';
    await loadDepartmentsForDelete();
}

async function loadDepartmentsForDelete() {
    try {
        const res = await fetch(`${API_BASE}/api/departments`);
        const departments = await res.json();
        
        const select = document.getElementById('deleteDepartmentSelect');
        select.innerHTML = '<option value="">Выберите отдел</option>';
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Ошибка загрузки отделов:', err);
    }
}

// Получение следующего ID (максимальный + 1)
function getNextEmployeeId() {
    if (!employees.length) return 1;
    const maxId = Math.max(...employees.map(emp => emp.id));
    return maxId + 1;
}

async function addEmptyEmployee() {
    try {
        const nextId = getNextEmployeeId();
        
        const emptyEmployee = {
            id: nextId,
            lastname: "Новый",
            firstname: "Сотрудник",
            middlename: "",
            name: "Новый Сотрудник",
            position: "Должность не указана",
            department: "Отдел не указан",
            email: "new@employee.ru",
            phone: "+7 (000) 000-00-00",
            hireDate: new Date().toISOString().split('T')[0],
            date_admission: new Date().toISOString().split('T')[0],
            bio: "",
            description: "",
            avatar: "img/team1.png",
            departament_id: 1,
            post_id: 1,
            image_id: null
        };
        
        const res = await fetch(`${API_BASE}/api/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lastname: emptyEmployee.lastname,
                firstname: emptyEmployee.firstname,
                middlename: emptyEmployee.middlename,
                email: emptyEmployee.email,
                phone: emptyEmployee.phone,
                date_admission: emptyEmployee.date_admission,
                description: emptyEmployee.description,
                departament_id: emptyEmployee.departament_id,
                post_id: emptyEmployee.post_id,
                image_id: emptyEmployee.image_id
            })
        });
        
        if (res.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEntityModal'));
            modal.hide();
            await loadEmployees();
            renderEmployees();
        }
    } catch (err) {
        console.error('Ошибка при добавлении сотрудника:', err);
    }
}

async function addDepartment() {
    const nameInput = document.getElementById('newDepartmentName');
    const name = nameInput.value.trim();
    
    if (!name) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        
        if (res.ok) {
            nameInput.value = '';
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEntityModal'));
            modal.hide();
            await loadEmployees();
            populateDepartmentMenu();
        }
    } catch (err) {
        console.error('Ошибка при добавлении отдела:', err);
    }
}

async function deleteDepartment() {
    const select = document.getElementById('deleteDepartmentSelect');
    const departmentId = select.value;
    
    if (!departmentId) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/departments/${departmentId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEntityModal'));
            modal.hide();
            await loadEmployees();
            populateDepartmentMenu();
            renderEmployees();
        }
    } catch (err) {
        console.error('Ошибка при удалении отдела:', err);
    }
}