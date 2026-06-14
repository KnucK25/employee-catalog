const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

let allAccountsData = [];
let employeesList = [];

function getAuthHeaders(contentType = 'application/json') {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': contentType
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function loadAccessData() {
    try {
        const [accountsRes, employeesRes] = await Promise.all([
            fetch(`${API_BASE}/api/accounts`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/api/employees`, { headers: getAuthHeaders() })
        ]);
        
        if (!accountsRes.ok) {
            throw new Error('Ошибка загрузки аккаунтов');
        }
        
        const accounts = await accountsRes.json();
        employeesList = await employeesRes.json();
        
        // Объединяем данные аккаунтов с данными сотрудников
        allAccountsData = accounts.map(acc => {
            const emp = employeesList.find(e => e.id === acc.employee_id);
            return {
                id: acc.id,
                login: acc.login,
                employee_id: acc.employee_id,
                access_level: acc.access_level,
                access_level_text: getAccessLevelText(acc.access_level),
                employeeName: emp ? emp.name : 'Неизвестный сотрудник',
                employeeAvatar: emp?.avatar || 'img/bio.png',
                employeeId: emp?.id || acc.employee_id,
                password: '********' // Пароль не хранится в открытом виде, показываем звёздочки
            };
        });
        
        renderAccessTable(allAccountsData);
        
    } catch (err) {
        console.error('Ошибка загрузки:', err);
        const container = document.getElementById('accessContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-danger">Не удалось загрузить данные. Проверьте сервер.</p>
                </div>
            `;
        }
    }
}

function getAccessLevelText(level) {
    switch(Number(level)) {
        case 1: return 'Пользователь';
        case 2: return 'HR';
        case 3: return 'Администратор';
        default: return 'Не определено';
    }
}

// Создание строки таблицы (как в adminPanel)
function createAccessRow(account) {
    const row = document.createElement('div');
    row.className = 'row admin-employee-row align-items-center';
    row.setAttribute('data-id', account.id);

    row.innerHTML = `
        <div class="col-md-3 d-flex align-items-center mb-3 mb-md-0" data-label="Сотрудник">
            <img src="${account.employeeAvatar}" alt="${account.employeeName}" class="admin-employee-photo me-3" style="width: 50px; height: 60px; object-fit: cover;">
            <div>
                <div class="admin-employee-name">${escapeHtml(account.employeeName)}</div>
                <div class="admin-employee-text">ID: ${String(account.employeeId).padStart(4, '0')}</div>
            </div>
        </div>
        <div class="col-md-3 mb-2 mb-md-0" data-label="Логин">
            <div class="login-text">${escapeHtml(account.login)}</div>
        </div>
        <div class="col-md-2 mb-2 mb-md-0" data-label="Пароль">
            <div class="password-text">${account.password}</div>
        </div>
        <div class="col-md-2 mb-2 mb-md-0" data-label="Права доступа">
            <div class="access-level-text">${account.access_level_text}</div>
        </div>
        <div class="col-md-2 d-flex gap-2 justify-content-md-end" data-label="Действия">
            <button class="btn btn-action-icon" title="Редактировать" onclick="openEditAccountModal(${account.id})">
                <img src="img/redact.png" alt="Ред." style="width: 20px; height: 20px;">
            </button>
            <button class="btn btn-action-icon" title="Удалить" onclick="deleteAccount(${account.id})">
                <img src="img/delete.png" alt="Уд." style="width: 20px; height: 20px;">
            </button>
        </div>
    `;
    
    return row;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderAccessTable(data) {
    const container = document.getElementById('accessContainer');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="text-center py-4"><p class="text-muted">Аккаунты не найдены</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    data.forEach(account => {
        const row = createAccessRow(account);
        container.appendChild(row);
    });
}

// Фильтр и поиск
function filterAndSearch() {
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const accessLevel = document.getElementById('accessLevelFilter')?.value || 'all';
    const sortBy = document.getElementById('sortByAccess')?.value || 'none';
    
    let filtered = [...allAccountsData];
    
    if (accessLevel !== 'all') {
        filtered = filtered.filter(acc => acc.access_level === parseInt(accessLevel));
    }
    
    if (searchQuery) {
        filtered = filtered.filter(acc => 
            (acc.employeeName || '').toLowerCase().includes(searchQuery) ||
            (acc.login || '').toLowerCase().includes(searchQuery)
        );
    }
    
    if (sortBy === 'asc') {
        filtered.sort((a, b) => a.access_level - b.access_level);
    } else if (sortBy === 'desc') {
        filtered.sort((a, b) => b.access_level - a.access_level);
    }
    
    renderAccessTable(filtered);
}

// Удаление аккаунта
async function deleteAccount(accountId) {
    if (!confirm('Вы уверены, что хотите удалить этот аккаунт?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/accounts/${accountId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!res.ok) {
            const error = await res.json();
            alert('Ошибка удаления: ' + (error.error || 'Неизвестная ошибка'));
            return;
        }
        
        alert('Аккаунт удалён');
        await loadAccessData();
    } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Ошибка сети при удалении');
    }
}

// Открытие модального окна редактирования аккаунта
let currentEditingAccountId = null;

function openEditAccountModal(accountId) {
    const account = allAccountsData.find(acc => acc.id === accountId);
    if (!account) return;
    
    currentEditingAccountId = accountId;
    
    document.getElementById('editAccountId').value = account.id;
    document.getElementById('editAccountLogin').value = account.login || '';
    document.getElementById('editAccountPassword').value = '';
    document.getElementById('editAccountLevel').value = account.access_level || 1;
    
    new bootstrap.Modal(document.getElementById('editAccountModal')).show();
}

async function saveAccountFromModal() {
    const accountId = parseInt(document.getElementById('editAccountId').value);
    const login = document.getElementById('editAccountLogin').value.trim();
    const password = document.getElementById('editAccountPassword').value.trim();
    const accessLevel = parseInt(document.getElementById('editAccountLevel').value);
    
    if (!login) {
        alert('Заполните логин');
        return;
    }
    
    try {
        // Обновляем логин и права доступа
        const updateData = {
            login: login,
            access_level: accessLevel
        };
        
        // Если пароль введён, обновляем и его
        if (password) {
            updateData.password = password;
        }
        
        const res = await fetch(`${API_BASE}/api/accounts/${accountId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });
        
        if (!res.ok) {
            const error = await res.json();
            alert('Ошибка сохранения: ' + (error.error || 'Неизвестная ошибка'));
            return;
        }
        
        alert('Аккаунт обновлён');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editAccountModal'));
        if (modal) modal.hide();
        
        await loadAccessData();
        
    } catch (err) {
        console.error('Ошибка сохранения:', err);
        alert('Ошибка сети при сохранении');
    }
}

// Создание аккаунта
function openCreateAccountModal() {
    document.getElementById('newAccountLogin').value = '';
    document.getElementById('newAccountPassword').value = '';
    document.getElementById('newAccountLevel').value = '1';
    
    // Заполняем список сотрудников
    const select = document.getElementById('newAccountEmployeeId');
    if (select) {
        select.innerHTML = '<option value="">Выберите сотрудника</option>';
        
        // Отфильтровываем сотрудников, у которых уже есть аккаунт
        const employeesWithAccount = allAccountsData.map(acc => acc.employeeId);
        const availableEmployees = employeesList.filter(emp => !employeesWithAccount.includes(emp.id));
        
        availableEmployees.forEach(emp => {
            select.innerHTML += `<option value="${emp.id}">${emp.name} — ${emp.post}</option>`;
        });
    }
    
    new bootstrap.Modal(document.getElementById('createAccountModal')).show();
}

async function createAccount() {
    const employeeId = document.getElementById('newAccountEmployeeId').value;
    const login = document.getElementById('newAccountLogin').value.trim();
    const password = document.getElementById('newAccountPassword').value.trim();
    const level = parseInt(document.getElementById('newAccountLevel').value);
    
    if (!employeeId || !login || !password) {
        alert('Заполните все поля');
        return;
    }
    
    if (password.length < 4) {
        alert('Пароль должен содержать минимум 4 символа');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                login: login,
                password: password,
                employee_id: parseInt(employeeId),
                level: level
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert('Ошибка ' + res.status + `: ${data.error || 'Неизвестная ошибка'}`);
            return;
        }
        
        alert('Аккаунт успешно создан');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('createAccountModal'));
        if (modal) modal.hide();
        
        await loadAccessData();
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка сети при создании аккаунта');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadAccessData();
    
    const searchInput = document.getElementById('searchInput');
    const accessFilter = document.getElementById('accessLevelFilter');
    const sortSelect = document.getElementById('sortByAccess');
    
    if (searchInput) searchInput.addEventListener('input', filterAndSearch);
    if (accessFilter) accessFilter.addEventListener('change', filterAndSearch);
    if (sortSelect) sortSelect.addEventListener('change', filterAndSearch);
});