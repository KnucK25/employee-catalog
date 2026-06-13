const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`

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

    row.innerHTML = `
        <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0" data-label="Сотрудник">
            <img src="${employee.avatar || 'img/bio.png'}" alt="${employee.name}" class="admin-employee-photo me-3" style="width: 50px; height: 60px; object-fit: cover;">
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
            <button class="btn btn-action-icon" title="Удалить" onclick="deleteEmployee(${employee.id})">
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
        
        if (!employeesRes.ok) throw new Error('Ошибка сервера');
        
        // Парсим все ответы
        employees = await employeesRes.json();
        departamentsList = await departamentsRes.json();
        postsList = await postsRes.json();
        
        // Теперь всё загружено, можно отрисовывать
        await populateDepartamentMenu(); // Отдельная функция для меню отделов
        await populatePostMenu('all'); // Отдельная функция для меню должностей
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


//Первая отрисовка страницы и слушатели фильтров + поиска
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, загружаем данные с сервера');
    loadEmployees();
    document.getElementById('departamentFilter').addEventListener('change', filter_and_search);
    document.getElementById('postFilter')?.addEventListener('change', filter_and_search);
    document.getElementById('searchInput')?.addEventListener('input', filter_and_search);
});
//---------------------------------------------------------------------------------------------------------

async function deleteEmployee(employeeId) {
    try {
        await fetch(`${API_BASE}/api/employees/${employeeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
    });
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
    //Обновляем поиск чтобы при удалении последнего пользователя вывелось что по поиску сотрудников не найдено
    filter_and_search()
}

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

    document.getElementById("editEmployeePhoto").value=''
    
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
        email: email,
        phone: phone,
        date_admission: currentEditingEmployee?.hireDate || new Date().toISOString().split('T')[0],
        description: description,
        post_id: postId,
        image_id: currentEditingEmployee?.image_id ?? null
    });

    const photoInput = document.getElementById('editEmployeePhoto');
    /**
     * @type {File}
     */
    const file = photoInput.files[0]
    if (!file) {
        try {
            const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: json_body
            });

            const data = await res.json()
        
            if (!res.ok) {
                alert("Ошибка " + res.status + ` ${data.error}`)
                return
            }
        
            // Закрываем модальное окно
            const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
            if (modal) modal.hide();
            
            // Перезагружаем данные
            await loadEmployees()
            // Обновляем поиск если он есть
            filter_and_search()
            
        } catch (err) {
            console.warn('Ошибка сохранения на сервере:', err);
            alert('Ошибка сети при сохранении');
        }
        return
    }
    if (file) {
        try {
            const blob = new Blob([file], {type:file.type})
            const res = await fetch(`/api/employees-and-photo/${employeeId}`, {
                method: 'PUT',
               headers: {
                    ...getAuthHeaders(file.type),
                    'Size-File': String(blob.size),
                    'X-Employee-Data': encodeURIComponent(json_body)
},
                body:blob
            })
            const data = await res.json()
            if (!res.ok) {
                alert("Ошибка " + res.status + ` ${data.error}`)
                return
            }

            // Закрываем модальное окно
            const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
            if (modal) modal.hide();
            
            // Перезагружаем данные
            await loadEmployees()
            const updatedEmployee = employees.find(e => e.id == employeeId);
            if (updatedEmployee) {
                updatedEmployee.avatar = `/api/images/${data.image_id}?t=${Date.now()}`;
            }
            // Обновляем поиск если он есть
            filter_and_search()
            
        } catch (err) {
            console.warn('Ошибка сохранения на сервере:', err);
            alert('Ошибка сети при сохранении');
        }
        return
    }

    alert("Возникла ошибка")
    return
}

// Добавляем обработчик загрузки фото в модальное окно
document.addEventListener('DOMContentLoaded', function () {
    const photoInput = document.getElementById('editEmployeePhoto');
    const currentPhoto = document.getElementById('currentPhotoImg');

    if (!photoInput || !currentPhoto) return;

    // 🔹 Вспомогательная функция: возвращает актуальное фото текущего сотрудника
    function getCurrentAvatarUrl() {
        const id = Number(document.getElementById('editEmployeeId').value);
        const emp = employees.find(e => e.id === id);
        // Если avatar есть и не пустая строка — используем его, иначе заглушку
        return emp?.avatar || "img/bio.png";
    }

    // 🔹 Обработчик выбора файла
    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];

        // Если пользователь отменил выбор
        if (!file) {
            currentPhoto.src = getCurrentAvatarUrl();
            return;
        }

        // Проверка расширения
        if (!/\.(png|jpe?g|webp)$/i.test(file.name)) {
            alert("Допустимы только .png, .jpg, .jpeg, .webp");
            photoInput.value = '';
            currentPhoto.src = getCurrentAvatarUrl();
            return;
        }

        // Показываем превью нового файла
        const objectUrl = URL.createObjectURL(file);
        currentPhoto.src = objectUrl;

        // Освобождаем память после отрисовки
        currentPhoto.onload = () => URL.revokeObjectURL(objectUrl);
    });
});

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

// Открытие модального окна
function openControlModal() {
    document.getElementById('addEmployeePanel').style.display = 'none';
    document.getElementById('departmentPanel').style.display = 'none';
    document.getElementById('postPanel').style.display = 'none';
    new bootstrap.Modal(document.getElementById('controlModal')).show();
}

// Показать форму регистрации
function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
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
//-------------------------------------------------------------------------

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

        /**
         * @type {({error:string } | {id:number, name:string })}
         */
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

// Удаление отдела
async function deleteDepartment(id) {
    try {
        const res = await fetch(`${API_BASE}/api/departaments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
});

        /**
        * @typedef {Object} PostItem
        * @property {number} id
        * @property {string} name
        * @property {number} departament_id
        * 
        * @typedef {Object} EmployeeItem
        * @property {number} id
        * @property {string} lastname
        * @property {string} firstname
        * @property {string} middlename
        * @property {string} email
        * @property {string} phone
        * @property {string} date_admission
        * @property {string} [description] // Квадратные скобки = необязательное поле
        * @property {number} post_id
        * @property {number|null} [image_id]
        * 
        * @typedef {PostItem[]} PostsArray       // Массив объектов PostItem
        * @typedef {EmployeeItem[]} EmployeesArray // Массив объектов EmployeeItem
        * 
        * @typedef { {error: string} | {message: string, deleted_posts: PostsArray, deleted_employees: EmployeesArray} } DeleteResponse
        */
        /**
         * @type {DeleteResponse}
         */
        const data = await res.json()

        if (!res.ok) {
            alert("Ошибка " + res.status + ` ${data.error}`)
            return
        }

        alert(JSON.stringify(data, null, 2))

        await loadDepartmentsForModal();
        await loadEmployees();
        return

    } catch (error) {
        alert('Сервер не доступен')
        console.error("Ошибка сети: ",error)
        return
    }
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
    try {
        const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
            name: name,
            departament_id: parseInt(departamentId)
        })
        });
        /**
         * @type {({error:string}|{id:number, name:string, departament_id:number})}
         */
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

// Удаление должности
async function deletePost(id) {
    try {
        const res = await fetch(`${API_BASE}/api/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
});
        /**
        * @typedef {Object} EmployeeItem
        * @property {number} id
        * @property {string} lastname
        * @property {string} firstname
        * @property {string} middlename
        * @property {string} email
        * @property {string} phone
        * @property {string} date_admission
        * @property {string} [description] // Квадратные скобки = необязательное поле
        * @property {number} post_id
        * @property {number|null} [image_id]
        * 
        * @typedef {EmployeeItem[]} EmployeesArray // Массив объектов EmployeeItem
        * 
        * @typedef { {error: string} | {message: string, deleted_posts: PostsArray, deleted_employees: EmployeesArray} } DeleteResponse
        */
        /**
         * @type {DeleteResponse}
         */
        const data = await res.json()

        if (!res.ok) {
            alert("Ошибка " + res.status + ` ${data.error}`)
            return
        }
        alert(JSON.stringify(data, null, 2))
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
        lastname: 'НОВЫЙ',
        firstname: '00_СОТРУДНИК',
        middlename: '',
        email: '',
        phone: '',
        date_admission: new Date().toISOString().split('T')[0],
        description: '',
        departament_id: 1,
        post_id: 1,
        image_id: null
    };

    await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(emptyEmployee)
    });

    const modal = bootstrap.Modal.getInstance(document.getElementById('controlModal'));
    if (modal) modal.hide();

    await loadEmployees();
}

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

        const data = await res.json();

        if (!res.ok) {
            alert('Ошибка ' + res.status + ` ${data.error}`);
            return;
        }

        alert('Аккаунт создан');

        const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
        if (modal) modal.hide();

    } catch (error) {
        alert('Ошибка сети при создании аккаунта');
        console.error(error);
    }
}