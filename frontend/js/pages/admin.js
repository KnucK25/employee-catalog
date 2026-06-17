const API_BASE = window.location.origin
// const currentToken = localStorage.getItem('authToken');
// const currentLevel = Number(localStorage.getItem('level') || 0);

// if (!currentToken || currentLevel < 2) {
//     alert('Недостаточно прав для доступа к админ-панели');  пока что не трогайте это сделан специально если вдруг сломается система прав и 1 уровень сможет зайти в админ панель!!!
//     window.location.href = 'index.html';
// }

let employees = [];
let departamentsList = [];
let postsList = [];
let selectedDepartament = null
let photovers = 1

function getAuthHeaders(contentType = 'application/json') {

    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': contentType,
        'Authorization': `Bearer ${token}`
    };
}

//Заполняет фильтр отделов
function populateDepartamentMenu() {
    const filter = document.getElementById('departamentFilter')
    if (!filter) return;
    const saveValue = filter.value
    filter.innerHTML = ''
    const allOpt = document.createElement('option')
    allOpt.value = 'all'
    allOpt.textContent = 'Все отделы'
    allOpt.selected = saveValue === 'all'
    filter.appendChild(allOpt);
    departamentsList.forEach(dep => {
        const Opt = document.createElement('option');
        Opt.value = dep.id
        Opt.textContent = dep.name
        if (saveValue !=='all') Opt.selected = Number(saveValue)===dep.id
        filter.appendChild(Opt);
    });
}

//Заполняет фильтр должностей в зависимости от выбранного отдела
function populatePostMenu(dep_id) {
    const filter = document.getElementById('postFilter')
    if (!filter) return;
    const saveValue = filter.value
    filter.innerHTML = ''
    const allOpt = document.createElement('option')
    allOpt.value = 'all'
    allOpt.textContent = 'Все должности'
    allOpt.selected = saveValue === 'all'
    filter.appendChild(allOpt);
    let Posts = postsList
    if (dep_id!='all') {
        Posts = postsList.filter(function(e){return e.departament_id === Number(dep_id)})
    }
    Posts.forEach(post => {
        const Opt = document.createElement('option');
        Opt.value = post.id
        Opt.textContent = post.name
        if (saveValue!=='all') Opt.selected = Number(saveValue)===post.id
        filter.appendChild(Opt);
    });
}

//Фильтрует и ищет пользователей по выбранным параметрам
function filter_and_search() {
    populatePostMenu(document.getElementById('departamentFilter').value)
    const filteredByDepartament = employees.filter(function (emp) {
        if (document.getElementById('departamentFilter').value === 'all') return true
        return emp.departament_id === Number(document.getElementById('departamentFilter').value)
    })
    
    const filteredByPost = filteredByDepartament.filter(function (emp) {
        if (document.getElementById('postFilter').value === 'all') return true
        return emp.post_id === Number(document.getElementById('postFilter').value)
    })

    function clearPhone(phone) {
        return '+'+(phone??'').replace(/\D/g,'')
    }
    
    const q = document.getElementById('searchInput').value.toLowerCase()
    const searched = filteredByPost.filter(function (emp) {
        const inID = String(emp.id) === q
        const inName = emp.name.toLowerCase().includes(q)
        const inPost = emp.post.toLowerCase().includes(q)
        const inDepartament = emp.departament.toLowerCase().includes(q)
        const inEmail = emp.email.toLowerCase().includes(q)
        const inPhone = clearPhone(emp.phone).includes(q)
        return inID || inName || inPost || inDepartament || inEmail || inPhone
    })
    
    renderEmployees(searched)
}

//Создает div пользователя
function createEmployeeRow(employee) {
    const row = document.createElement('div');
    row.className = 'row admin-employee-row align-items-center';
    row.setAttribute('data-id', employee.id);
    row.setAttribute('data-department', employee.departament);
    row.setAttribute('data-name', employee.name.toLowerCase());
    row.setAttribute('data-position', employee.post.toLowerCase());
    const avatarUrl = employee.avatar ? `${employee.avatar}?v=${photovers}` : 'img/bio.png'
    row.innerHTML = `
        <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0" data-label="Сотрудник">
            <img src="${avatarUrl}" class="admin-employee-photo me-3" style="width: 50px; height: 60px; object-fit: cover;">
            <div>
                <div class="admin-employee-name">${employee.name}</div>
                <div class="admin-employee-text">ID: ${String(employee.id).padStart(4, '0')}</div>
            </div>
        </div>
        <div class="col-md-3 mb-2 mb-md-0" data-label="Отдел / Должность">
            <div class="admin-employee-name" style="font-size: 0.9rem;">${employee.departament}</div>
            <div class="admin-employee-text">${employee.post}</div>
        </div>
        <div class="col-md-3 mb-3 mb-md-0" data-label="Контакты">
            <div class="admin-employee-text">${employee.phone}</div>
            <div class="admin-employee-text">${employee.email}</div>
        </div>
        <div class="col-md-2 d-flex gap-2 justify-content-md-end" data-label="Действия">
            <button class="btn btn-action-icon" title="Редактировать" onclick="editEmployee(${employee.id})">
                <img src="img/redact.png" alt="Ред." style="width: 20px; height: 20px;">
            </button>
            <button class="btn btn-action-icon" title="Удалить" onclick="confirmDeleteModal(${employee.id})">
                <img src="img/delete.png" alt="Уд." style="width: 20px; height: 20px;">
            </button>
        </div>
    `;

    console.log('Строка создана для:', employee.name);
    return row;
}

//Запускает функцию создания строк пользователей и отрисовывает их
/**
 * @typedef {Object} Employee
 * @property {number} id
 * @property {string} name
 * @property {string} firstname
 * @property {string} lastname
 * @property {string} middlename
 * @property {string} post
 * @property {string} departament
 * @property {number} departament_id
 * @property {number} post_id
 * @property {string} email
 * @property {string} phone
 * @property {string} hireDate
 * @property {string} bio
 * @property {string|null} avatar
 * @property {number} image_id
 * @typedef {Employee[]} Employees
 * 
 * @param {Employees} employeesList 
 */
function renderEmployees(employeesList) {
    const container = document.getElementById('employeesContainer');
    if (!container) return;

    container.innerHTML=''

    if (!employeesList || !employeesList.length) {
        container.innerHTML = `<div class="row"><div class="col-12 text-center py-4"><p class="text-muted">Сотрудники не найдены</p></div></div>`;
        return;
    }

    employeesList.forEach(employee => {
        const row = createEmployeeRow(employee);
        container.appendChild(row);
    });
}

//Получает с сервера и записывает профили должности и отделы, отрисовывает отделы, должности и пользователей
async function loadEmployees() {
    try {
    // Загружаем всё параллельно и ждём завершения
        const [employeesRes, departamentsRes, postsRes] = await Promise.all([
            fetch(`${API_BASE}/api/employees`),
            fetch(`${API_BASE}/api/departaments`),
            fetch(`${API_BASE}/api/posts`)
        ]);
        if (employeesRes.status === 401) {
            alert('Сессия истекла. Войдите снова.');
            localStorage.clear();
            window.location.href = '/';
            return;
        }
        
        if (!employeesRes.ok) throw new Error('Ошибка сервера');
        employees = await employeesRes.json();
        departamentsList = await departamentsRes.json();
        postsList = await postsRes.json();
        
        await populateDepartamentMenu();
        await populatePostMenu('all');
        await renderEmployees(employees);
        
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

// Подключение к SSE для получения уведомлений об изменениях
let eventSource = null;

function connectSSE() {
    if (eventSource) {
        eventSource.close();
    }
    
    eventSource = new EventSource(`${API_BASE}/api/events`);
    
    eventSource.onopen = () => {
        console.log('SSE подключение установлено');
    };
    
    eventSource.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('Получено событие:', message);
            
            if (message.type === 'employees.updated') {
                console.log('Сотрудники обновлены, перезагружаем...');
                photovers++
                loadEmployees().then(() => {
                    filter_and_search();
                });
            }
            
            if (message.type === 'departments.updated') {
                console.log('Отделы обновлены, перезагружаем...');
                photovers++
                loadEmployees().then(
                    () => populateDepartamentMenu().then(
                        () => filter_and_search()
                    )
                )
            }
            
            if (message.type === 'posts.updated') {
                console.log('Должности обновлены, перезагружаем...');
                const selectedDep = document.getElementById('departamentFilter').value
                photovers++
                loadEmployees().then(
                    () => populatePostMenu(selectedDep).then(
                        () => filter_and_search()
                    )
                );
            }
            
            if (message.type === 'connected') {
                console.log('Подключён к серверу уведомлений');
            }
            
        } catch (err) {
            console.error('Ошибка обработки SSE события:', err);
        }
    };
    
    eventSource.onerror = (err) => {
        console.error('SSE ошибка:', err);
    };
}

//Первая отрисовка страницы и слушатели фильтров + поиска
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, загружаем данные с сервера');
    loadEmployees();
    document.getElementById('departamentFilter').addEventListener('change', filter_and_search);
    document.getElementById('postFilter')?.addEventListener('change', filter_and_search);
    document.getElementById('searchInput')?.addEventListener('input', filter_and_search);
    document.getElementById('exportBtn')?.addEventListener('click', exportAllEmployees);
    connectSSE();
});

// Принудительно закрываем SSE при уходе со страницы
window.addEventListener('beforeunload', () => {
    if (eventSource) {
        console.log('Закрываем SSE при уходе со страницы');
        eventSource.close();
        eventSource = null;
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && eventSource) {
        console.log('Вкладка скрыта, закрываем SSE');
        eventSource.close();
        eventSource = null;
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !eventSource) {
        console.log('Вкладка активна, переподключаем SSE');
        connectSSE();
    }
});

// ============================================================
// НОВЫЕ ФУНКЦИИ ДЛЯ МОДАЛЬНЫХ ОКОН И ВАЛИДАЦИИ
// ============================================================

// Функция для отображения сообщения об ошибке в стиле всплывающего предупреждения
function showProfileError(message, details = null) {
    const existingError = document.querySelector('#editEmployeeModal .profile-error');
    if (existingError) existingError.remove();

    const modalBody = document.querySelector('#editEmployeeModal .modal-body');
    if (!modalBody) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'profile-error alert alert-danger mt-3';
    errorDiv.style.cssText = 'border-radius: 0; font-size: 0.85rem; padding: 0.5rem 1rem; margin-bottom: 0;';

    errorDiv.innerHTML = `${message}`;

    if (details) {
        const detailsSpan = document.createElement('div');
        detailsSpan.style.cssText = 'font-size: 0.75rem; margin-top: 0.3rem; opacity: 0.8;';
        detailsSpan.textContent = details;
        errorDiv.appendChild(detailsSpan);
    }

    modalBody.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv) errorDiv.remove();
    }, 10000);
}

// Функция для отображения модального окна с сообщением
function showMessageModal(title, message, type = 'info', callback = null) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    const modalId = `messageModal_${Date.now()}`;
    modalContainer.id = modalId;
    modalContainer.setAttribute('tabindex', '-1');
    modalContainer.setAttribute('aria-labelledby', `${modalId}Label`);
    modalContainer.setAttribute('aria-hidden', 'true');

    const buttonClass = (type === 'error' || type === 'warning') ? 'btn-cancel' : 'btn-save';

    modalContainer.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}Label">${title}</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn ${buttonClass}" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    const modal = new bootstrap.Modal(modalContainer);
    modal.show();

    modalContainer.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modalContainer);
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
}

// ============================================================
// МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ СОТРУДНИКА
// ============================================================

function confirmDeleteModal(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    const name = employee ? employee.name : `#${employeeId}`;

    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    const modalId = `confirmDeleteModal_${employeeId}`;
    modalContainer.id = modalId;
    modalContainer.setAttribute('tabindex', '-1');
    modalContainer.setAttribute('aria-labelledby', `${modalId}Label`);
    modalContainer.setAttribute('aria-hidden', 'true');

    modalContainer.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}Label">Подтверждение удаления</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                </div>
                <div class="modal-body text-center">
                    <p class="mb-2">Вы уверены, что хотите удалить сотрудника?</p>
                    <p class="fw-bold">${name}</p>
                    <p class="text-muted small mt-2">Это действие нельзя будет отменить.</p>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-cancel" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-save" id="confirmDeleteBtn_${employeeId}">Удалить</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    const modal = new bootstrap.Modal(modalContainer);
    modal.show();

    document.getElementById(`confirmDeleteBtn_${employeeId}`).addEventListener('click', async function() {
        modal.hide();
        await performDeleteEmployee(employeeId);
    });

    modalContainer.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modalContainer);
    });
}

async function performDeleteEmployee(employeeId) {
    try {
        const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.status === 401) {
            showProfileError('Сессия истекла', 'Пожалуйста, войдите снова');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/';
            }, 2000);
            return;
        }

        if (!res.ok) {
            const data = await res.json();
            showProfileError('Ошибка ' + res.status, data.error || 'Попробуйте позже');
            return;
        }

        showMessageModal('Успех', 'Сотрудник успешно удален!', 'success', async () => {
            await loadEmployees();
            filter_and_search();
        });

    } catch (err) {
        console.warn('Ошибка удаления на сервере:', err);
        showProfileError('Ошибка сети', 'Не удалось удалить сотрудника. Проверьте подключение к интернету.');
    }
}

// ============================================================
// УДАЛЕНИЕ ОТДЕЛА С МОДАЛЬНЫМ ОКНОМ
// ============================================================

async function deleteDepartment(id) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    const modalId = 'confirmDeleteDepartmentModal';
    modalContainer.id = modalId;
    modalContainer.setAttribute('tabindex', '-1');
    modalContainer.setAttribute('aria-labelledby', `${modalId}Label`);
    modalContainer.setAttribute('aria-hidden', 'true');

    modalContainer.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}Label">Подтверждение</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                </div>
                <div class="modal-body text-center">
                    <p class="mb-0">Вы уверены, что хотите удалить этот отдел?</p>
                    <p class="text-muted small mt-2">Все сотрудники и должности в этом отделе будут удалены.</p>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-cancel" data-bs-dismiss="modal">Отменить</button>
                    <button type="button" class="btn btn-save" id="confirmDeleteDeptBtn">Удалить</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    const modal = new bootstrap.Modal(modalContainer);
    modal.show();

    document.getElementById('confirmDeleteDeptBtn').addEventListener('click', async function() {
        modal.hide();

        try {
            const res = await fetch(`${API_BASE}/api/departaments/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.status === 401) {
                showProfileError('Сессия истекла', 'Пожалуйста, войдите снова');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '/';
                }, 2000);
                return;
            }

            const data = await res.json()

            if (!res.ok) {
                showProfileError('Ошибка ' + res.status, data.error || 'Попробуйте позже');
                return
            }

            let successMessage = data.message;
            if (data.deleted_posts && data.deleted_posts.length > 0) {
                successMessage += `\nУдалено должностей: ${data.deleted_posts.length}`;
            }
            if (data.deleted_employees && data.deleted_employees.length > 0) {
                successMessage += `\nУдалено сотрудников: ${data.deleted_employees.length}`;
            }

            showMessageModal('Успех', successMessage, 'success', async () => {
                await loadDepartmentsForModal();
                await loadEmployees();
            });

        } catch (error) {
            console.error("Ошибка сети: ", error)
        }
    });

    modalContainer.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modalContainer);
    });
}

// ============================================================
// УДАЛЕНИЕ ДОЛЖНОСТИ С МОДАЛЬНЫМ ОКНОМ
// ============================================================

async function deletePost(postId) {
    const row = document.querySelector(`tr[data-post-id="${postId}"]`);
    const postName = row ? row.querySelector('.post-name')?.textContent.trim() : `должности #${postId}`;

    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    const modalId = `confirmDeletePostModal`;
    modalContainer.id = modalId;
    modalContainer.setAttribute('tabindex', '-1');
    modalContainer.setAttribute('aria-labelledby', `${modalId}Label`);
    modalContainer.setAttribute('aria-hidden', 'true');

    modalContainer.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}Label">Подтверждение удаления</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                </div>
                <div class="modal-body text-center">
                    <p class="mb-2">Вы уверены, что хотите удалить должность?</p>
                    <p class="fw-bold">${postName}</p>
                    <p class="text-muted small mt-2">Это действие нельзя отменить. Все сотрудники с этой должностью будут переназначены.</p>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-cancel" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-save" id="confirmDeletePostBtn">Удалить</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    const modal = new bootstrap.Modal(modalContainer);
    modal.show();

    document.getElementById('confirmDeletePostBtn').addEventListener('click', async function() {
        modal.hide();
        await performDeletePost(postId);
    });

    modalContainer.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modalContainer);
    });
}

async function performDeletePost(postId) {
    try {
        const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.status === 401) {
            showProfileError('Сессия истекла', 'Пожалуйста, войдите снова');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/';
            }, 2000);
            return;
        }

        if (res.status === 404) {
            showProfileError('Не найдено', 'Должность не найдена');
            return;
        }

        if (res.status === 409) {
            showProfileError('Невозможно удалить', 'К этой должности привязаны сотрудники. Сначала переназначьте их.');
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            showProfileError('Ошибка ' + res.status, data.error || 'Попробуйте позже');
            return;
        }

        showMessageModal('Успех', 'Должность успешно удалена!', 'success', async () => {
            await loadPostsForModal();
            await loadEmployees();
        });

    } catch (error) {
        console.error('Ошибка при удалении должности:', error);
        showProfileError('Ошибка сети', 'Не удалось удалить должность. Проверьте подключение к интернету.');
    }
}

// ============================================================
// РЕДАКТИРОВАНИЕ СОТРУДНИКА С ВАЛИДАЦИЕЙ
// ============================================================

let currentEditingEmployee = null;

async function editEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    currentEditingEmployee = employee;
    
    document.getElementById('editEmployeeId').value = employee.id;
    document.getElementById('editLastname').value = employee.lastname || '';
    document.getElementById('editFirstname').value = employee.firstname || '';
    document.getElementById('editMiddlename').value = employee.middlename || '';
    document.getElementById('editPhone').value = employee.phone || '';
    document.getElementById('editEmail').value = employee.email || '';
    document.getElementById('editDescription').value = employee.description || employee.bio || '';
    
    const deptSelect = document.getElementById('editDepartmentId');
    deptSelect.innerHTML = '<option value="">Выберите отдел</option>';
    
    for (const dept of departamentsList) {
        const selected = (dept.id === employee.departament_id) ? 'selected' : '';
        deptSelect.innerHTML += `<option value="${dept.id}" ${selected}>${dept.name}</option>`;
    }
    
    await loadPostsForEditModal(employee.departament_id);
    
    const photoImg = document.getElementById('currentPhotoImg');
    if (employee.avatar && employee.avatar !== 'img/bio.png') {
        photoImg.src = `${employee.avatar}?v=${photovers}`;
        photoImg.style.display = 'block';
    } else {
        photoImg.src = 'img/bio.png';
        photoImg.style.display = 'block';
    }

    document.getElementById("editEmployeePhoto").value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

async function loadPostsForEditModal(departamentId) {
    const postSelect = document.getElementById('editPostId');
    postSelect.innerHTML = '<option value="">Выберите должность</option>';
    
    const filteredPosts = postsList.filter(p => p.departament_id === departamentId);
    
    for (const post of filteredPosts) {
        const selected = (currentEditingEmployee && post.id === currentEditingEmployee.post_id) ? 'selected' : '';
        postSelect.innerHTML += `<option value="${post.id}" ${selected}>${post.name}</option>`;
    }
}

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

    // Валидация с всплывающими сообщениями об ошибках
    if (!lastname) {
        showProfileError('Фамилия обязательна для заполнения', 'Пожалуйста, укажите фамилию сотрудника');
        return;
    }

    if (!firstname) {
        showProfileError('Имя обязательно для заполнения', 'Пожалуйста, укажите имя сотрудника');
        return;
    }

    if (!departamentId || isNaN(departamentId)) {
        showProfileError('Выберите отдел', 'Пожалуйста, выберите отдел из списка');
        return;
    }

    if (!postId || isNaN(postId)) {
        showProfileError('Выберите должность', 'Пожалуйста, выберите должность из списка');
        return;
    }

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showProfileError('Некорректный Email', 'Пожалуйста, введите email в формате example@domain.com');
            return;
        }
    }

    if (phone) {
        const phoneRegex = /^[0-9+\-() ]+$/;
        if (!phoneRegex.test(phone)) {
            showProfileError('Некорректный номер телефона', 'Номер телефона может содержать только цифры, знаки +, -, скобки и пробелы');
            return;
        }
    }

    const fullName = `${lastname} ${firstname} ${middlename}`.trim();

    const json_body = JSON.stringify({
        firstname: firstname,
        lastname: lastname,
        middlename: middlename,
        email: email,
        phone: phone,
        date_admission: currentEditingEmployee?.hireDate || new Date().toISOString().split('T')[0],
        description: description,
        post_id: postId,
        image_id: currentEditingEmployee?.image_id ?? null
    });

    const photoInput = document.getElementById('editEmployeePhoto');
    const file = photoInput.files[0]

    async function processSaveResponse(res) {
        if (res.status === 401) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
            if (modal) modal.hide();
            showProfileError('Сессия истекла', 'Пожалуйста, войдите снова');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/';
            }, 2000);
            return;
        }

        const data = await res.json()

        if (!res.ok) {
            if (res.status !== 0 && res.status !== 504 && res.status !== 503) {
                showProfileError('Ошибка ' + res.status, data.error || 'Попробуйте позже');
            }
            return;
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
        if (modal) modal.hide();

        showMessageModal('Успех', 'Профиль сотрудника успешно обновлен!', 'success', async () => {
            await loadEmployees();
            filter_and_search();
        });
    }

    if (!file) {
        const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: json_body
        });

        await processSaveResponse(res);
        return;
    }

    if (file) {
        if (!/\.(png|jpe?g|webp)$/i.test(file.name)) {
            showProfileError('Недопустимый формат файла', 'Допустимы только .png, .jpg, .jpeg, .webp');
            return;
        }

        const blob = new Blob([file], {type:file.type})
        const res = await fetch(`/api/employees-and-photo/${employeeId}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(file.type),
                'Size-File': String(blob.size),
                'X-Employee-Data': encodeURIComponent(json_body)
            },
            body:blob
        });

        await processSaveResponse(res);
        return;
    }

    showProfileError('Ошибка сохранения', 'Пожалуйста, попробуйте снова');
}

// ============================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ)
// ============================================================

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

// Загрузка отделов для модального окна должностей
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

// Добавление отдела
async function addDepartment() {
    const name = document.getElementById('newDepartmentName').value.trim();
    if (!name) return;
    try {
        const res = await fetch(`${API_BASE}/api/departaments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });

        if (res.status === 401) {
            alert('Сессия истекла. Войдите снова.');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        const data = await res.json()

        if (!res.ok) {
            alert('Ошибка ' + res.status + ` ${data.error}`)
            return
        }

        document.getElementById('newDepartmentName').value = '';
        await loadDepartmentsForModal();
        await loadEmployees();
    
    } catch (error) {
        alert('Сервер не доступен')
        console.error("Ошибка сети: ",error)
        return
    }
}

// Добавление должности
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
    try {
        const res = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                name: name,
                departament_id: parseInt(departamentId)
            })
        });
        if (res.status === 401) {
            alert('Сессия истекла. Войдите снова.');
            localStorage.clear();
            window.location.href = '/';
            return;
        }
        const data = await res.json()

        if (!res.ok) {
            alert('Ошибка ' + res.status + ` ${data.error}`)
            return
        }

        document.getElementById('newPostName').value = '';
        document.getElementById('postDepartmentSelect').value = '';
        await loadPostsForModal();
        await loadEmployees();
        return

    } catch (error) {
        alert('Сервер не доступен')
        console.error("Ошибка сети: ",error)
        return
    }
}

// Добавление пустого сотрудника
async function addEmptyEmployee() {
    const emptyEmployee = {
        lastname: '',
        firstname: '',
        middlename: '',
        email: '',
        phone: '',
        date_admission: new Date().toISOString().split('T')[0],
        description: '',
        post_id: 1,
        image_id: null
    };

    try {
        const res = await fetch(`${API_BASE}/api/employees`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(emptyEmployee)
        });

        if (res.status === 401) {
            alert('Сессия истекла. Войдите снова.');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        if (!res.ok) {
            const data = await res.json();
            alert('Ошибка ' + res.status + ` ${data.error}`);
            return;
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('controlModal'));
        if (modal) modal.hide();

        await loadEmployees();
    } catch (err) {
        console.error('Ошибка создания сотрудника:', err);
        alert('Ошибка сети при создании сотрудника');
    }
}

// Открытие модального окна управления
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
    await loadDepartmentsForPostModal();
    await loadPostsForModal();
}

// Открытие модального окна аккаунтов
function openAccountModal() {
    const select = document.getElementById('accountEmployeeId');
    if (!select) return;

    select.innerHTML = '<option value="">Выберите сотрудника</option>';

    employees.forEach(employee => {
        select.innerHTML += `
            <option value="${employee.id}">
                ${employee.name} — ${employee.post}
            </option>
        `;
    });

    document.getElementById('accountLogin').value = '';
    document.getElementById('accountPassword').value = '';
    document.getElementById('accountLevel').value = '1';

    new bootstrap.Modal(document.getElementById('accountModal')).show();
}

// Создание аккаунта из админ-панели
async function createAccountFromAdmin() {
    const employeeId = Number(document.getElementById('accountEmployeeId').value);
    const login = document.getElementById('accountLogin').value.trim();
    const password = document.getElementById('accountPassword').value.trim();
    const level = Number(document.getElementById('accountLevel').value);

    if (!employeeId || !login || !password || !level) {
        alert('Заполните все поля');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                login,
                password,
                employee_id: employeeId,
                level
            })
        });

        if (res.status === 401) {
            alert('Сессия истекла. Войдите снова.');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        const data = await res.json();

        if (!res.ok) {
            alert('Ошибка ' + res.status + ` ${data.error}`);
            return;
        }

        showMessageModal('Успех', 'Аккаунт создан!', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
        if (modal) modal.hide();

    } catch (error) {
        alert('Ошибка сети при создании аккаунта');
        console.error(error);
    }
}

// Экспорт сотрудников в CSV
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

// Проверка доступа и редирект на страницу прав доступа
function checkAccessAndRedirect() {
    const level = Number(localStorage.getItem('level') || 0);
    
    if (level < 3) {
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal fade';
        modalContainer.id = 'accessDeniedModal';
        modalContainer.setAttribute('tabindex', '-1');
        modalContainer.setAttribute('aria-hidden', 'true');
        modalContainer.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Доступ запрещён</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <p class="mb-3">Страница "Права доступа" доступна только администраторам.</p>
                        <p class="text-muted small">Обратитесь к администратору для получения доступа.</p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-cancel" data-bs-dismiss="modal">Подтвердить</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);
        const modal = new bootstrap.Modal(modalContainer);
        modal.show();
        modalContainer.addEventListener('hidden.bs.modal', () => modalContainer.remove());
    } else {
        window.location.href = 'accessPanel.html';
    }
}