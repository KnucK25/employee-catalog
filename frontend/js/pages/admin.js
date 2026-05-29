 // отладка
    console.log('Скрипт загрузился');
    console.log('Тип employees:', typeof employees);

    if (typeof employees !== 'undefined') {
        console.log('Количество сотрудников:', employees.length);
        console.log('Первый сотрудник:', employees[0]);
    }

    function createEmployeeRow(employee) {
        const row = document.createElement('div');
        row.className = 'row admin-employee-row align-items-center';
        row.setAttribute('data-id', employee.id);
        row.setAttribute('data-department', employee.department);
        row.setAttribute('data-name', employee.name.toLowerCase());
        row.setAttribute('data-position', employee.position.toLowerCase());

        row.innerHTML = `
            <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0">
                <img src="${employee.avatar}" alt="${employee.name}" class="admin-employee-photo me-3">
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
                    <img src="../frontend/img/button_00.png" alt="Ред." style="width: 20px; height: 20px;">
                </button>
                <button class="btn btn-action-icon" title="Удалить" onclick="deleteEmployee(${employee.id})">
                    <img src="../frontend/img/button_01.png" alt="Уд." style="width: 20px; height: 20px;">
                </button>
            </div>
        `;

        console.log('Строка создана для:', employee.name);
        return row;
    }

    function deleteEmployee(employeeId) {
    // Находим и удаляем строку из DOM
    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);
    if (row) {
        row.remove();
    }

    // Удаляем из массива employees
    const index = employees.findIndex(emp => emp.id === employeeId);
    if (index !== -1) {
        employees.splice(index, 1);
    }

    // Если массив пуст - показываем сообщение
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
            <img src="${employee.avatar}" alt="${employee.name}" class="admin-employee-photo me-3">
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
function saveEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const row = document.querySelector(`.admin-employee-row[data-id="${employeeId}"]`);

    employee.name = row.querySelector('.edit-name').value.trim();
    employee.position = row.querySelector('.edit-position').value.trim();
    employee.department = row.querySelector('.edit-department').value.trim();
    employee.phone = row.querySelector('.edit-phone').value.trim();
    employee.email = row.querySelector('.edit-email').value.trim();

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

        // Удаляем старые строки
        const existingRows = container.querySelectorAll('.admin-employee-row');
        console.log('Старых строк найдено:', existingRows.length);
        existingRows.forEach(row => row.remove());

        // Проверяем наличие данных
        if (typeof employees === 'undefined' || !employees.length) {
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

        

        // Создаём строки
        employees.forEach(employee => {
            const row = createEmployeeRow(employee);
            container.appendChild(row);
        });

        console.log('Всего строк добавлено:', employees.length);
    }

    // Запуск сразу после загрузки DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM загружен, вызываем renderEmployees');
        renderEmployees();
    });
