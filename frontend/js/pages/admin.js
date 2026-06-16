const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`

let employees = [];
let departmentsList = [];
let postsList = [];
let editingEmployeeId = null; // ID строки, которая сейчас редактируется
let selectedDepartament = null

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
        await renderEmployees();
        await populateDepartmentMenu(); // Отдельная функция для меню отделов
        await populatePostMenu(); // Отдельная функция для меню должностей
        
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

function populatePostMenu() {
    const menu = document.getElementById('postMenu')
    if (!menu) return;
    menu.innerHTML = ''
    const AllLi = document.createElement('li')
    AllLi.innerHTML = `<a class="dropdown-item" href="#" onclick="filterByPost('all')">Все должности</a>`;
    if (selectedDepartament === null) {
        postsList.forEach(post => {
            const li = document.createElement('li')
            li.innerHTML = `<a class="dropdown-item" href="#" onclick="filterByPost('${post.name}')">${post.name}</a>`
            menu.appendChild(li)
        })
    }
    else {
        
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
                <img src="img/redact.png" alt="Ред." style="width: 20px; height: 20px;">
            </button>
            <button class="btn btn-action-icon" title="Удалить" onclick="deleteEmployee(${employee.id})">
                <img src="img/delete.png" alt="Уд." style="width: 20px; height: 20px;">
            </button>
            <button class="btn btn-action-icon" title="Экспорт" onclick="exportEmployee(${employee.id})">
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
async function editEmployee(employeeId) {
    // Если уже редактируется ДРУГАЯ строка — отменяем предыдущую
    if (editingEmployeeId !== null && editingEmployeeId !== employeeId) {
        cancelEdit(editingEmployeeId);
    }

    // Если эта же строка уже редактируется — ничего не делаем
    if (editingEmployeeId === employeeId) return;

    editingEmployeeId = employeeId;

    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);
    if (!row) return;

    let currentLogin = '';
    try {
        const res = await fetch(`${API_BASE}/api/accounts/by-employee/${employeeId}`);
        if (res.ok) {
            const data = await res.json();
            currentLogin = data.login ?? '';
        }
    } catch (err) {
        console.warn('Не удалось загрузить логин:', err);
    }

    const hasAccount = currentLogin !== '';
    const passwordPlaceholder = hasAccount ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль (обязательно)';

    row.innerHTML = `
        <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0">
            <img src="${employee.avatar || 'img/bio.png'}" alt="${employee.name}" class="admin-employee-photo me-3">
            <div>
                <div class="admin-employee-name">${employee.name}</div>
                ${!hasAccount ? '<div class="text-warning small">Аккаунт не создан</div>' : ''}
            </div>
        </div>
        <div class="col-md-6 mb-3 mb-md-0">
            <input type="text" class="form-control form-control-sm border-light mb-1 edit-login" value="${currentLogin}" placeholder="Логин">
            <input type="password" class="form-control form-control-sm border-light edit-password" placeholder="${passwordPlaceholder}">
        </div>
        <div class="col-md-2 d-flex gap-2 justify-content-md-end">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEmployee(${employeeId})" title="Сохранить">✓</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEdit(${employeeId})" title="Отмена">✕</button>
        </div>
    `;
}

// Сохранение изменений
async function saveEmployee(employeeId) {
    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);
    if (!row) return;

    const login = row.querySelector('.edit-login').value.trim();
    const password = row.querySelector('.edit-password').value;

    if (!login) {
        alert('Логин не может быть пустым');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/accounts/by-employee/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password: password || undefined })
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

    editingEmployeeId = null;
    renderEmployees();
    console.log(`Аккаунт сотрудника ${employeeId} обновлён`);
}

// Отмена редактирования
function cancelEdit(employeeId) {
    editingEmployeeId = null; // ✅ Сбрасываем флаг
    renderEmployees();
}

function renderEmployees() {
    const container = document.getElementById('employeesContainer');
    if (!container) {
        console.error('Контейнер employeesContainer НЕ найден!');
        return;
    }

    // ✅ Сохраняем позицию скролла
    const scrollY = window.scrollY;

    const existingRows = container.querySelectorAll('.admin-employee-row');
    existingRows.forEach(row => row.remove());

    if (!employees || !employees.length) {
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

    // ✅ Восстанавливаем позицию скролла после перерисовки DOM
    // ✅ Восстанавливаем позицию скролла мгновенно
    requestAnimationFrame(() => {
        window.scrollTo({
            top: scrollY,
            behavior: 'instant'
    });
});
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
        selectedDepartament = null
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

function filterByPost(post) {
    const btn = document.getElementById('postDropdown');

    if (btn) {
        btn.textContent = post === 'all' ? 'Все должности' : post;
    }

    if (post === 'all') {
        renderEmployees();
        return;
    }

    const filtered = employees.filter(e => e.position === post);
    const container = document.getElementById('employeesContainer');

    if (!container) return;

    const existingRows = container.querySelectorAll('.admin-employee-row');
    existingRows.forEach(row => row.remove());
    filtered.forEach(emp => container.appendChild(createEmployeeRow(emp)));
}

async function exportAllEmployees() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Для экспорта необходимо войти в аккаунт');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/employees/export/csv`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            alert('Сессия истекла. Войдите снова.');
            localStorage.removeItem('authToken');
            return;
        }

        if (!res.ok) {
            alert('Ошибка экспорта');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employees.csv';
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Ошибка сети при экспорте');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, загружаем данные с сервера');
    loadEmployees();
});


// Открытие модального окна
function openControlModal() {
    document.getElementById('addEmployeePanel').style.display = 'none';
    document.getElementById('departmentPanel').style.display = 'none';
    document.getElementById('postPanel').style.display = 'none';
    new bootstrap.Modal(document.getElementById('controlModal')).show();
}

// Показать форму добавления сотрудника
function showAddEmployeeForm() {
    document.getElementById('addEmployeePanel').style.display = 'block';
    document.getElementById('departmentPanel').style.display = 'none';
    document.getElementById('postPanel').style.display = 'none';
}

// Показать панель отделов
async function showDepartmentPanel() {
    document.getElementById('addEmployeePanel').style.display = 'none';
    document.getElementById('departmentPanel').style.display = 'block';
    document.getElementById('postPanel').style.display = 'none';
    await loadDepartmentsForModal();
}

// Показать панель должностей
async function showPostPanel() {
    document.getElementById('addEmployeePanel').style.display = 'none';
    document.getElementById('departmentPanel').style.display = 'none';
    document.getElementById('postPanel').style.display = 'block';
    await loadPostsForModal();
}

// Загрузка отделов для модалки
async function loadDepartmentsForModal() {
    const res = await fetch(`${API_BASE}/api/departments`);
    const depts = await res.json();
    const container = document.getElementById('departmentsList');
    container.innerHTML = '';
    depts.forEach(dept => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            ${dept.name}
            <button class="btn btn-delete" onclick="deleteDepartment(${dept.id})">Удалить</button>
        `;
        container.appendChild(li);
    });
}

// Загрузка должностей для модалки
async function loadPostsForModal() {
    const res = await fetch(`${API_BASE}/api/posts`);
    const posts = await res.json();
    const container = document.getElementById('postsList');
    container.innerHTML = '';
    posts.forEach(post => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            ${post.name}
            <button class="btn btn-delete" onclick="deletePost(${post.id})">Удалить</button>
        `;
        container.appendChild(li);
    });
}

// Добавление отдела
async function addDepartment() {
    const name = document.getElementById('newDepartmentName').value.trim();
    if (!name) return false;
    await fetch(`${API_BASE}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    document.getElementById('newDepartmentName').value = '';
    await loadDepartmentsForModal();
    await loadEmployees();
}

// Удаление отдела
async function deleteDepartment(id) {
    await fetch(`${API_BASE}/api/departments/${id}`, { method: 'DELETE' });
    await loadDepartmentsForModal();
    await loadEmployees();
}

// Добавление должности
async function addPost() {
    const name = document.getElementById('newPostName').value.trim();
    if (!name) return false;
    await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    document.getElementById('newPostName').value = '';
    await loadPostsForModal();
    await loadEmployees();
}

// Удаление должности
async function deletePost(id) {
    await fetch(`${API_BASE}/api/posts/${id}`, { method: 'DELETE' });
    await loadPostsForModal();
    await loadEmployees();
}

// Добавление пустого сотрудника
async function addEmptyEmployee() {
    const emptyEmployee = {
        lastname: 'Новый',
        firstname: 'Сотрудник',
        middlename: '',
        email: 'Пусто',
        phone: 'Пусто',
        date_admission: new Date().toISOString().split('T')[0],
        description: '',
        departament_id: 1,
        post_id: 1,
        image_id: null
    };

    await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyEmployee)
    });

    const modal = bootstrap.Modal.getInstance(document.getElementById('controlModal'));
    if (modal) modal.hide();

    await loadEmployees();
}