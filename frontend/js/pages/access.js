const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

let allAccountsData = [];
let employeesList = [];

function getAuthHeaders(contentType = 'application/json') {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': contentType };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Функция для отображения сообщения об ошибке под конкретным полем
function showFieldError(inputElement, message) {
    const parent = inputElement.parentElement;
    
    // Удаляем существующую ошибку для этого поля
    let errorDiv = parent.querySelector('.field-error-message');
    if (errorDiv) errorDiv.remove();
    
    // Создаём новую ошибку
    errorDiv = document.createElement('div');
    errorDiv.className = 'field-error-message auth-error alert alert-danger mt-2';
    errorDiv.style.cssText = 'border-radius: 0; font-size: 0.8rem; padding: 0.3rem 0.8rem; margin-bottom: 0;';
    errorDiv.textContent = message;
    
    inputElement.classList.add('is-invalid-custom');
    parent.appendChild(errorDiv);
    
    // Удаляем ошибку через 10 секунд
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
        }
        inputElement.classList.remove('is-invalid-custom');
    }, 10000);
}

// Функция для очистки всех ошибок в форме
function clearAllFieldErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const errorDivs = form.querySelectorAll('.field-error-message');
    errorDivs.forEach(div => div.remove());
    
    const invalidInputs = form.querySelectorAll('.is-invalid-custom');
    invalidInputs.forEach(input => input.classList.remove('is-invalid-custom'));
}

// Функция для отображения сообщения об успехе
function showAuthSuccess(message, containerId, modal, form) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const existingSuccess = container.querySelector('.auth-success');
    if (existingSuccess) existingSuccess.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-success alert alert-success mt-3';
    successDiv.style.cssText = 'border-radius: 0; font-size: 0.85rem; padding: 0.5rem 1rem; margin-bottom: 0;';
    successDiv.textContent = message;
    
    container.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv) successDiv.remove();
        if (modal) modal.hide();
        if (form) form.reset();
    }, 3000);
}

// Валидация email
function isValidEmail(email) {
    if (email === 'admin@admin') return true;
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
}

// Подтверждение удаления
function confirmDeleteModal(accountId, accountName) {
    const modalId = `confirmDeleteModal_${accountId}`;
    let modalContainer = document.getElementById(modalId);
    
    if (modalContainer) modalContainer.remove();
    
    modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    modalContainer.id = modalId;
    modalContainer.setAttribute('tabindex', '-1');
    modalContainer.setAttribute('aria-hidden', 'true');
    modalContainer.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Подтверждение удаления</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                </div>
                <div class="modal-body">
                    Вы уверены, что хотите удалить аккаунт сотрудника <strong>${escapeHtml(accountName)}</strong>? Действие нельзя будет отменить.
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-cancel" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-danger" style="border-radius: 0;" onclick="performDeleteAccount(${accountId})">Удалить</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    const modal = new bootstrap.Modal(modalContainer);
    modal.show();
    
    modalContainer.addEventListener('hidden.bs.modal', () => {
        modalContainer.remove();
    });
}

async function performDeleteAccount(accountId) {
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
        
        await loadAccessData();
    } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Ошибка сети при удалении');
    }
}

async function loadAccessData() {
    try {
        const [accountsRes, employeesRes] = await Promise.all([
            fetch(`${API_BASE}/api/accounts`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/api/employees`, { headers: getAuthHeaders() })
        ]);
        
        if (!accountsRes.ok) throw new Error('Ошибка загрузки аккаунтов');
        
        const accounts = await accountsRes.json();
        employeesList = await employeesRes.json();
        
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
                password: '********'
            };
        });
        
        renderAccessTable(allAccountsData);
        filterAndSearch();
        
    } catch (err) {
        console.error('Ошибка загрузки:', err);
        const container = document.getElementById('accessContainer');
        if (container) {
            container.innerHTML = `<div class="text-center py-4"><p class="text-danger">Не удалось загрузить данные. Проверьте сервер.</p></div>`;
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

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
            <button class="btn btn-action-icon" title="Удалить" onclick="confirmDeleteModal(${account.id}, '${escapeHtml(account.employeeName)}')">
                <img src="img/delete.png" alt="Уд." style="width: 20px; height: 20px;">
            </button>
        </div>
    `;
    return row;
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
        container.appendChild(createAccessRow(account));
    });
}

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

// Редактирование аккаунта
function openEditAccountModal(accountId) {
    const account = allAccountsData.find(acc => acc.id === accountId);
    if (!account) return;
    
    document.getElementById('editAccountId').value = account.id;
    document.getElementById('editAccountLogin').value = account.login || '';
    document.getElementById('editAccountPassword').value = '';
    document.getElementById('editAccountLevel').value = account.access_level || 1;
    
    // Очищаем старые ошибки
    clearAllFieldErrors('editAccountForm');
    
    new bootstrap.Modal(document.getElementById('editAccountModal')).show();
}

async function saveAccountFromModal() {
    const accountId = parseInt(document.getElementById('editAccountId').value);
    const login = document.getElementById('editAccountLogin').value.trim();
    const password = document.getElementById('editAccountPassword').value.trim();
    const accessLevel = parseInt(document.getElementById('editAccountLevel').value);
    
    const loginInput = document.getElementById('editAccountLogin');
    const passwordInput = document.getElementById('editAccountPassword');
    
    // Очищаем старые ошибки
    clearAllFieldErrors('editAccountForm');
    
    let hasError = false;
    
    if (!login) {
        showFieldError(loginInput, 'Введите логин');
        hasError = true;
    } else if (!isValidEmail(login)) {
        showFieldError(loginInput, 'Неверный формат email');
        hasError = true;
    }
    
    if (password && password.length < 4) {
        showFieldError(passwordInput, 'Пароль должен содержать минимум 4 символа');
        hasError = true;
    }
    
    if (hasError) return;
    
    try {
        const updateData = { login: login, access_level: accessLevel };
        if (password) updateData.password = password;
        
        const res = await fetch(`${API_BASE}/api/accounts/${accountId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });
        
        if (!res.ok) {
            const error = await res.json();
            showFieldError(loginInput, error.error || 'Ошибка сохранения');
            return;
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editAccountModal'));
        if (modal) modal.hide();
        await loadAccessData();
        
    } catch (err) {
        console.error('Ошибка сохранения:', err);
        showFieldError(loginInput, 'Ошибка сети при сохранении');
    }
}

// Создание аккаунта
function openCreateAccountModal() {
    document.getElementById('newAccountLogin').value = '';
    document.getElementById('newAccountPassword').value = '';
    document.getElementById('newAccountLevel').value = '1';
    
    const select = document.getElementById('newAccountEmployeeId');
    if (select) {
        select.innerHTML = '<option value="">Выберите сотрудника</option>';
        const employeesWithAccount = allAccountsData.map(acc => Number(acc.employee_id));
        const availableEmployees = employeesList.filter(emp => !employeesWithAccount.includes(Number(emp.id)));
        
        availableEmployees.forEach(emp => {
            select.innerHTML += `<option value="${emp.id}">${emp.name} — ${emp.post}</option>`;
        });
    }
    
    // Очищаем старые ошибки
    clearAllFieldErrors('createAccountForm');
    
    new bootstrap.Modal(document.getElementById('createAccountModal')).show();
}

async function createAccount() {
    const employeeId = document.getElementById('newAccountEmployeeId').value;
    const login = document.getElementById('newAccountLogin').value.trim();
    const password = document.getElementById('newAccountPassword').value.trim();
    const level = parseInt(document.getElementById('newAccountLevel').value);
    
    const employeeSelect = document.getElementById('newAccountEmployeeId');
    const loginInput = document.getElementById('newAccountLogin');
    const passwordInput = document.getElementById('newAccountPassword');
    
    // Очищаем старые ошибки
    clearAllFieldErrors('createAccountForm');
    
    let hasError = false;
    
    if (!employeeId) {
        showFieldError(employeeSelect, 'Выберите сотрудника');
        hasError = true;
    }
    
    if (!login) {
        showFieldError(loginInput, 'Введите логин');
        hasError = true;
    } else if (!isValidEmail(login)) {
        showFieldError(loginInput, 'Неверный формат email');
        hasError = true;
    }
    
    if (!password) {
        showFieldError(passwordInput, 'Введите пароль');
        hasError = true;
    } else if (password.length < 4) {
        showFieldError(passwordInput, 'Пароль должен содержать минимум 4 символа');
        hasError = true;
    }
    
    if (hasError) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                login: login,
                encryptedPassword: password,
                employee_id: parseInt(employeeId),
                level: level
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            showFieldError(loginInput, data.error || 'Ошибка создания аккаунта');
            return;
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('createAccountModal'));
        if (modal) modal.hide();
        await loadAccessData();
        
    } catch (error) {
        console.error('Ошибка:', error);
        showFieldError(loginInput, 'Ошибка сети при создании аккаунта');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadAccessData();
    
    const searchInput = document.getElementById('searchInput');
    const accessFilter = document.getElementById('accessLevelFilter');
    const sortSelect = document.getElementById('sortByAccess');
    
    if (searchInput) searchInput.addEventListener('input', filterAndSearch);
    if (accessFilter) accessFilter.addEventListener('change', filterAndSearch);
    if (sortSelect) sortSelect.addEventListener('change', filterAndSearch);
});