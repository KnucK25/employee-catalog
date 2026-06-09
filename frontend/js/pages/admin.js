const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`

let employees = [];
let departamentsList = [];
let postsList = [];
let editingEmployeeId = null; // ID строки, которая сейчас редактируется
let selectedDepartament = null

async function loadEmployees() {
    try {
        // Загружаем всё параллельно и ждём завершения
        const [employeesRes, departamentsRes, postsRes] = await Promise.all([
            fetch(`${API_BASE}/api/employees`),
            fetch(`${API_BASE}/api/departaments`),
            fetch(`${API_BASE}/api/posts`)
        ]);
        
        if (!employeesRes.ok) throw new Error('Ошибка сервера');
        
        // Парсим все ответы
        employees = await employeesRes.json();
        departamentsList = await departamentsRes.json();
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
    departamentsList.forEach(dep => {
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

function createEmployeeRow(employee) {
    const row = document.createElement('div');
    row.className = 'row admin-employee-row align-items-center';
    row.setAttribute('data-id', employee.id);
    row.setAttribute('data-department', employee.departament);
    row.setAttribute('data-name', employee.name.toLowerCase());
    row.setAttribute('data-position', employee.post.toLowerCase());

    row.innerHTML = `
        <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0">
            <img src="${employee.avatar || 'img/team1.png'}" alt="${employee.name}" class="admin-employee-photo me-3" style="width: 50px; height: 50px; object-fit: cover;">
            <div>
                <div class="admin-employee-name">${employee.name}</div>
                <div class="admin-employee-text">ID: ${String(employee.id).padStart(4, '0')}</div>
            </div>
        </div>
        <div class="col-md-3 mb-2 mb-md-0">
            <div class="admin-employee-name" style="font-size: 0.9rem;">${employee.departament}</div>
            <div class="admin-employee-text">${employee.post}</div>
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

// Переменная для хранения текущего редактируемого сотрудника
let currentEditingEmployee = null;

// Функция открытия модального окна редактирования
async function editEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    currentEditingEmployee = employee;
    
    // Заполняем форму
    document.getElementById('editEmployeeId').value = employee.id;
    document.getElementById('editLastname').value = employee.lastname || '';
    document.getElementById('editFirstname').value = employee.firstname || '';
    document.getElementById('editMiddlename').value = employee.middlename || '';
    document.getElementById('editPhone').value = employee.phone || '';
    document.getElementById('editEmail').value = employee.email || '';
    document.getElementById('editDescription').value = employee.description || employee.bio || '';
    
    // Загружаем отделы в выпадающий список
    const deptSelect = document.getElementById('editDepartmentId');
    deptSelect.innerHTML = '<option value="">Выберите отдел</option>';
    
    for (const dept of departamentsList) {
        const selected = (dept.id === employee.departament_id) ? 'selected' : '';
        deptSelect.innerHTML += `<option value="${dept.id}" ${selected}>${dept.name}</option>`;
    }
    
    // Загружаем должности в выпадающий список (только для выбранного отдела)
    await loadPostsForEditModal(employee.departament_id);
    
    // Показываем текущее фото, если есть
    const photoImg = document.getElementById('currentPhotoImg');
    if (employee.avatar && employee.avatar !== 'img/bio.png') {
        photoImg.src = employee.avatar;
        photoImg.style.display = 'block';
    } else {
        photoImg.style.display = 'none';
    }
    
    // Открываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

// Загрузка должностей для модального окна (фильтрация по отделу)
async function loadPostsForEditModal(departamentId) {
    const postSelect = document.getElementById('editPostId');
    postSelect.innerHTML = '<option value="">Выберите должность</option>';
    
    // Фильтруем должности по отделу
    const filteredPosts = postsList.filter(p => p.departament_id === departamentId || p.departament_id === departamentId);
    
    for (const post of filteredPosts) {
        const selected = (currentEditingEmployee && post.id === currentEditingEmployee.post_id) ? 'selected' : '';
        postSelect.innerHTML += `<option value="${post.id}" ${selected}>${post.name}</option>`;
    }
}

// При изменении отдела перезагружаем должности
document.addEventListener('DOMContentLoaded', function() {
    const deptSelect = document.getElementById('editDepartmentId');
    if (deptSelect) {
        deptSelect.addEventListener('change', function() {
            const deptId = parseInt(this.value);
            if (deptId) {
                loadPostsForEditModal(deptId);
            } else {
                document.getElementById('editPostId').innerHTML = '<option value="">Выберите должность</option>';
            }
        });
    }
});

// Сохранение из модального окна
async function saveEmployeeFromModal() {
    const employeeId = document.getElementById('editEmployeeId').value;
    const lastname = document.getElementById('editLastname').value.trim();
    const firstname = document.getElementById('editFirstname').value.trim();
    const middlename = document.getElementById('editMiddlename').value.trim();
    const departamentId = parseInt(document.getElementById('editDepartmentId').value);
    const postId = parseInt(document.getElementById('editPostId').value);
    const phone = document.getElementById('editPhone').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    
    // Валидация
    if (!lastname || !firstname) {
        alert('Фамилия и имя обязательны для заполнения');
        return;
    }
    
    if (!departamentId || !postId) {
        alert('Выберите отдел и должность');
        return;
    }
    
    const fullName = `${lastname} ${firstname} ${middlename}`.trim();
    
    const json_body = JSON.stringify({
        firstname: firstname,
        lastname: lastname,
        middlename: middlename,
        name: fullName,
        email: email,
        phone: phone,
        date_admission: currentEditingEmployee?.hireDate || new Date().toISOString().split('T')[0],
        description: description,
        departament_id: departamentId,
        post_id: postId,
        image_id: currentEditingEmployee?.image_id ?? null
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
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
        if (modal) modal.hide();
        
        // Перезагружаем данные
        await loadEmployees();
        
    } catch (err) {
        console.warn('Ошибка сохранения на сервере:', err);
        alert('Ошибка сети при сохранении');
    }
}

// Функция загрузки фото (дополнительно)
async function uploadEmployeePhoto(employeeId, file) {
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
        const res = await fetch(`${API_BASE}/api/employees/${employeeId}/photo`, {
            method: 'POST',
            body: formData
        });
        
        if (res.ok) {
            await loadEmployees();
            return true;
        }
    } catch (err) {
        console.warn('Ошибка загрузки фото:', err);
    }
    return false;
}

// Добавляем обработчик загрузки фото в модальное окно
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById('editEmployeePhoto');
    if (photoInput) {
        photoInput.addEventListener('change', async function(e) {
            const employeeId = document.getElementById('editEmployeeId').value;
            if (employeeId && e.target.files[0]) {
                const success = await uploadEmployeePhoto(employeeId, e.target.files[0]);
                if (success) {
                    alert('Фото загружено');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
                    if (modal) modal.hide();
                    await loadEmployees();
                } else {
                    alert('Ошибка загрузки фото');
                }
            }
        });
    }
});

// Сохранение изменений
async function saveEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);

    const lastname = row.querySelector('.edit-lastname').value.trim();
    const firstname = row.querySelector('.edit-firstname').value.trim();
    const middlename = row.querySelector('.edit-middlename').value.trim();

    // Удаляем старые ошибки, если есть
    const existingErrors = row.querySelectorAll('.field-error');
    existingErrors.forEach(err => err.remove());

    let hasError = false;

    // Проверка: фамилия и имя обязательны
    if (!lastname || !firstname) {
        hasError = true;
        
        if (!lastname) {
            const lastNameInput = row.querySelector('.edit-lastname');
            const errorSpan = document.createElement('div');
            errorSpan.className = 'field-error text-danger small mt-1';
            errorSpan.textContent = 'Фамилия обязательна';
            lastNameInput.parentNode.appendChild(errorSpan);
        }
        
        if (!firstname) {
            const firstNameInput = row.querySelector('.edit-firstname');
            const errorSpan = document.createElement('div');
            errorSpan.className = 'field-error text-danger small mt-1';
            errorSpan.textContent = 'Имя обязательно';
            firstNameInput.parentNode.appendChild(errorSpan);
        }
        
        return;
    }

    const departament_id = parseInt(row.querySelector('.edit-department-id').value);
    const post_id = parseInt(row.querySelector('.edit-post-id').value);

    const phone = row.querySelector('.edit-phone').value.trim();
    const email = row.querySelector('.edit-email').value.trim();

    // Формируем полное имя для обратной совместимости
    const fullName = `${lastname} ${firstname} ${middlename}`.trim();

    const json_body = JSON.stringify({
        firstname: firstname,
        lastname: lastname,
        middlename: middlename,
        name: fullName,
        email: email,
        phone: phone,
        date_admission: employee.hireDate,
        description: employee.bio ?? '',
        departament_id: departament_id,
        post_id: post_id,
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
            
            // Показываем ошибку под соответствующим полем
            const errorMessage = error.error || 'Неизвестная ошибка';
            const firstField = row.querySelector('.edit-lastname');
            const errorSpan = document.createElement('div');
            errorSpan.className = 'field-error text-danger small mt-1';
            errorSpan.textContent = 'Ошибка: ' + errorMessage;
            firstField.parentNode.appendChild(errorSpan);
            return;
        }
        
        editingEmployeeId = null;
        await loadEmployees();
    } catch (err) {
        console.warn('Ошибка сохранения на сервере:', err);
        
        // Показываем ошибку сети
        const firstField = row.querySelector('.edit-lastname');
        const errorSpan = document.createElement('div');
        errorSpan.className = 'field-error text-danger small mt-1';
        errorSpan.textContent = 'Ошибка сети при сохранении';
        firstField.parentNode.appendChild(errorSpan);
    }
}

// Отмена редактирования
// function cancelEdit(employeeId) {
//     editingEmployeeId = null; 
//     renderEmployees();
// }

function renderEmployees() {
    const container = document.getElementById('employeesContainer');
    if (!container) return;

    const existingRows = container.querySelectorAll('.admin-employee-row');
    existingRows.forEach(row => row.remove());

    if (!employees || !employees.length) {
        container.innerHTML = `<div class="row"><div class="col-12 text-center py-4"><p class="text-muted">Сотрудники не найдены</p></div></div>`;
        return;
    }

    employees.forEach(employee => {
        const row = createEmployeeRow(employee);
        container.appendChild(row);
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
        e.post.toLowerCase().includes(query) ||
        e.departament.toLowerCase().includes(query)
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

    const filtered = employees.filter(e => e.departament === dept);
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

    const filtered = employees.filter(e => e.post === post);
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
    
    // Загружаем отделы для выпадающего списка
    await loadDepartmentsForPostModal();
    await loadPostsForModal();
}

// Новая функция: загрузка отделов для модального окна должностей
async function loadDepartmentsForPostModal() {
    const res = await fetch(`${API_BASE}/api/departaments`);
    const depts = await res.json();
    const select = document.getElementById('postDepartmentSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите отдел</option>';
    depts.forEach(dept => {
        select.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
}

// Загрузка отделов для модалки
async function loadDepartmentsForModal() {
    const res = await fetch(`${API_BASE}/api/departaments`);
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
    await fetch(`${API_BASE}/api/departaments`, {
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
    await fetch(`${API_BASE}/api/departaments/${id}`, { method: 'DELETE' });
    await loadDepartmentsForModal();
    await loadEmployees();
}

// Добавление должности (с привязкой к отделу)
async function addPost() {
    const name = document.getElementById('newPostName').value.trim();
    const departamentId = document.getElementById('postDepartmentSelect').value;
    
    if (!name) {
        alert('Введите название должности');
        return false;
    }
    
    if (!departamentId) {
        alert('Выберите отдел для должности');
        return false;
    }
    
    await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: name,
            departament_id: parseInt(departamentId)
        })
    });
    
    document.getElementById('newPostName').value = '';
    document.getElementById('postDepartmentSelect').value = '';
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