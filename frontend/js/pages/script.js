// script.js - только авторизация с полной диагностикой ошибок

// Шифрование пароля
async function getPublicKey() {
    const API_BASE = window.location.origin;
    try {
        const res = await fetch(`${API_BASE}/api/auth/public-key`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        return data.publicKey;
    } catch (err) {
        console.error('Ошибка получения публичного ключа:', err);
        throw new Error('Не удалось получить ключ шифрования. Проверьте сервер.');
    }
}

async function encryptPassword(password) {
    try {
        const publicKeyPem = await getPublicKey();
        
        const publicKey = await window.crypto.subtle.importKey(
            'spki',
            pemToArrayBuffer(publicKeyPem),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['encrypt']
        );

        const encodedPassword = new TextEncoder().encode(password);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            encodedPassword
        );

        return arrayBufferToBase64(encrypted);
    } catch (err) {
        console.error('Ошибка шифрования пароля:', err);
        throw new Error('Ошибка шифрования данных');
    }
}

function pemToArrayBuffer(pem) {
    const base64 = pem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '');

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

// Функция для отображения сообщения об ошибке в модальном окне
function showAuthError(message, details = null) {
    const existingError = document.querySelector('#loginForm .auth-error');
    if (existingError) existingError.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error alert alert-danger mt-3';
    errorDiv.style.cssText = 'border-radius: 0; font-size: 0.85rem; padding: 0.5rem 1rem; margin-bottom: 0;';
    
    // Основное сообщение
    errorDiv.innerHTML = `${message}`;
    
    // Если есть детали, добавляем их
    if (details) {
        const detailsSpan = document.createElement('div');
        detailsSpan.style.cssText = 'font-size: 0.75rem; margin-top: 0.3rem; opacity: 0.8;';
        detailsSpan.textContent = details;
        errorDiv.appendChild(detailsSpan);
    }
    
    const loginForm = document.getElementById('loginForm');
    loginForm.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv) errorDiv.remove();
    }, 10000);
}

// Функция для отображения сообщения об успехе
function showAuthSuccess(message, modal, form) {
    const existingSuccess = document.querySelector('#loginForm .auth-success');
    if (existingSuccess) existingSuccess.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-success alert alert-success mt-3';
    successDiv.style.cssText = 'border-radius: 0; font-size: 0.85rem; padding: 0.5rem 1rem; margin-bottom: 0;';
    successDiv.textContent = message;
    
    const loginForm = document.getElementById('loginForm');
    loginForm.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv) successDiv.remove();
        if (modal) modal.hide();
        form.reset();
        window.location.href = 'index.html';
    }, 1500);
}

// Функция для проверки состояния сервера
async function checkServerStatus() {
    const API_BASE = window.location.origin;
    try {
        const res = await fetch(`${API_BASE}/api/employees`, { method: 'HEAD' });
        return res.ok;
    } catch (err) {
        return false;
    }
}

// Обработка авторизации ЗАГЛУШКА
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!login || !password) { alert('Заполните все поля'); return; }

            try {
                const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

                const encryptedPassword = await encryptPassword(password);
                const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, encryptedPassword })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'Ошибка входа');
                    return;
                }

                localStorage.setItem('authToken', data.token);
                localStorage.setItem('level', data.level);
                const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if (modal) modal.hide();
                loginForm.reset();
                alert('Вход выполнен');

                // --- ДОБАВЛЕНО: Переход на страницу profile.html после успешного входа ---
                window.location.href = 'profile.html';

            } catch (err) {
                alert('Ошибка сети при входе');
            }
        });
    }

/*
// Обработка авторизации
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const login = loginEmail.value.trim().toLowerCase();
        const password = loginPassword.value;
        
        // Удаляем старые сообщения
        const existingError = document.querySelector('#loginForm .auth-error');
        if (existingError) existingError.remove();
        
        const existingSuccess = document.querySelector('#loginForm .auth-success');
        if (existingSuccess) existingSuccess.remove();
        
        //  ВАЛИДАЦИЯ 1: Проверка заполнения полей 
        if (!login && !password) {
            showAuthError('Заполните все поля');
            return;
        }

        if (!login) {
            showAuthError('Введите email');
            return;
        }

        if (!password) {
            showAuthError('Введите пароль');
            return;
        }

        //  ВАЛИДАЦИЯ 2: Проверка формата email
        function isValidEmail(email) {
            if (email === 'admin@admin') return true;
            const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
            return emailRegex.test(email);
        }

        if (!login) { 
            showAuthError('Введите email'); 
            return; 
        }

        //  ПРОВЕРКА СЕРВЕРА 
        const serverAvailable = await checkServerStatus();
        if (!serverAvailable) {
            showAuthError('Сервер недоступен', 'Проверьте, запущен ли сервер на порту 3000');
            return;
        }
        
        try {
            const API_BASE = window.location.origin;
            
            //  ШИФРОВАНИЕ ПАРОЛЯ 
            let encryptedPassword;
            try {
                encryptedPassword = await encryptPassword(password);
            } catch (encryptErr) {
                console.error('Ошибка шифрования:', encryptErr);
                showAuthError('Ошибка шифрования данных', 'Попробуйте позже или обратитесь к администратору');
                return;
            }
            
            // ОТПРАВКА ЗАПРОСА 
            let res;
            try {
                res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, encryptedPassword })
                });
            } catch (fetchErr) {
                console.error('Ошибка сети:', fetchErr);
                showAuthError('Нет соединения с сервером', 'Проверьте интернет-соединение и запущен ли сервер');
                return;
            }
            
            // ОБРАБОТКА ОТВЕТА 
            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                console.error('Ошибка парсинга ответа:', jsonErr);
                showAuthError('Сервер вернул некорректный ответ', 'Попробуйте позже');
                return;
            }
            
            // ОБРАБОТКА HTTP СТАТУСОВ 
            if (!res.ok) {
                switch (res.status) {
                    case 400:
                        showAuthError('Неверный запрос');
                        break;
                    case 401:
                        showAuthError('Неверный email или пароль');
                        break;
                    case 403:
                        showAuthError('Доступ запрещён');
                        break;
                    case 404:
                        showAuthError('Сервис авторизации не найден');
                        break;
                    case 500:
                        showAuthError('Внутренняя ошибка сервера');
                        break;
                    default:
                        showAuthError(`Ошибка ${res.status}`);
                }
                return;
            }
            
            // ПРОВЕРКА НАЛИЧИЯ ДАННЫХ В ОТВЕТЕ 
            if (!data.token) {
                showAuthError('Сервер не вернул токен авторизации', 'Попробуйте позже');
                return;
            }
            
            if (!data.level && data.level !== 0) {
                console.warn('Уровень доступа не указан, установлен 0');
            }
            
            // УСПЕШНАЯ АВТОРИЗАЦИЯ 
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('level', data.level || 0);
            
            // Обновляем навигацию и кнопки
            if (typeof updateNavigation === 'function') {
                updateNavigation();
            }
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            showAuthSuccess('Вход выполнен успешно', modal, loginForm);
            
        } catch (err) {
            console.error('Необработанная ошибка:', err);
            showAuthError('Неизвестная ошибка', 'Попробуйте позже или обратитесь к администратору');
        }
    });
}

*/

// Очищаем поля и сообщения при открытии модального окна
document.addEventListener('DOMContentLoaded', function() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('show.bs.modal', function() {
            loginForm.reset();
            const existingError = document.querySelector('#loginForm .auth-error');
            if (existingError) existingError.remove();
            const existingSuccess = document.querySelector('#loginForm .auth-success');
            if (existingSuccess) existingSuccess.remove();
        });
    }
});
// ========================================
// АВТОМАТИЧЕСКАЯ ПРОВЕРКА ТОКЕНА
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('authToken');
    
    // Если токена нет — ничего не делаем
    if (!token) return;
    
    // Проверяем валидность токена на сервере
    try {
        const API_BASE = window.location.origin;
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        
        // Если токен невалиден — очищаем localStorage
        if (!res.ok) {
            console.log('Токен невалиден, очищаем localStorage');
            localStorage.removeItem('authToken');
            localStorage.removeItem('level');
            localStorage.removeItem('employeeId');
            
            // Перезагружаем страницу, чтобы UI обновился
            window.location.reload();
        }
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        // При сетевой ошибке не делаем ничего (сервер может быть временно недоступен)
    }
});

// Удаляем сообщения при вводе в поля
if (loginEmail) {
    loginEmail.addEventListener('input', function() {
        const existingError = document.querySelector('#loginForm .auth-error');
        if (existingError) existingError.remove();
        const existingSuccess = document.querySelector('#loginForm .auth-success');
        if (existingSuccess) existingSuccess.remove();
    });
}

if (loginPassword) {
    loginPassword.addEventListener('input', function() {
        const existingError = document.querySelector('#loginForm .auth-error');
        if (existingError) existingError.remove();
        const existingSuccess = document.querySelector('#loginForm .auth-success');
        if (existingSuccess) existingSuccess.remove();
    });
}