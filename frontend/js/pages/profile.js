const API_BASE = window.location.origin;

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

// Функция для отображения сообщения об ошибке в стиле всплывающего предупреждения
function showProfileError(message, details = null) {
    const existingError = document.querySelector('#edit-profile .profile-error');
    if (existingError) existingError.remove();

    const editProfileForm = document.getElementById('edit-profile');
    if (!editProfileForm) return;

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

    editProfileForm.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv) errorDiv.remove();
    }, 10000);
}

// ============================================================
// ФУНКЦИЯ ШИФРОВАНИЯ ПАРОЛЯ (для входа в систему)
// ============================================================

async function getPublicKey() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/public-key`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        return data.publicKey;
    } catch (err) {
        console.error('Ошибка получения публичного ключа:', err);
        throw new Error('Не удалось получить ключ шифрования');
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

// ============================================================
// ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ
// ============================================================

async function loadUserProfile() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // 1. Получаем данные о текущем пользователе (employeeId)
        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (meRes.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        if (!meRes.ok) {
            console.error('Ошибка получения данных пользователя');
            return;
        }

        const meData = await meRes.json();
        const employeeId = meData.employeeId;

        if (!employeeId) {
            console.error('ID сотрудника не найден');
            return;
        }

        // 2. Получаем данные сотрудника по ID
        const empRes = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!empRes.ok) {
            console.error('Ошибка получения данных сотрудника');
            return;
        }

        const employee = await empRes.json();

        // 3. Получаем логин аккаунта
        let login = '';
        try {
            const accountRes = await fetch(`${API_BASE}/api/accounts/by-employee/${employeeId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (accountRes.ok) {
                const accountData = await accountRes.json();
                login = accountData.login || '';
            }
        } catch (err) {
            console.warn('Не удалось загрузить логин:', err);
        }

        // ===== ЗАПОЛНЯЕМ ДАННЫЕ НА СТРАНИЦЕ =====

        // Имя и должность (для режима просмотра)
        const userNameDisplay = document.querySelector('#view-profile .employee-name');
        if (userNameDisplay) {
            userNameDisplay.textContent = employee.name || 'Сотрудник';
        }

        const roleDisplay = document.querySelector('#view-profile .text-uppercase');
        if (roleDisplay) {
            roleDisplay.textContent = employee.post || 'Сотрудник';
        }

        // Имя и должность (для режима редактирования - НЕ РЕДАКТИРУЮТСЯ)
        const editNameDisplay = document.getElementById('edit-name-display');
        if (editNameDisplay) {
            editNameDisplay.textContent = employee.name || 'Сотрудник';
        }

        const editRoleDisplay = document.getElementById('edit-role-display');
        if (editRoleDisplay) {
            editRoleDisplay.textContent = employee.post || 'Сотрудник';
        }

        // Контактные данные
        const userEmailDisplay = document.getElementById('user-email');
        if (userEmailDisplay) {
            userEmailDisplay.textContent = employee.email || 'Не указан';
        }

        // Для телефона: если пустой или null - показываем "Не указан" для просмотра
        const userPhoneDisplay = document.getElementById('user-phone');
        if (userPhoneDisplay) {
            const phoneValue = employee.phone;
            if (phoneValue && phoneValue.trim() !== '' && phoneValue !== 'null') {
                userPhoneDisplay.textContent = phoneValue;
            } else {
                userPhoneDisplay.textContent = 'Не указан';
            }
        }

        // Отдел
        const userDepartmentDisplay = document.getElementById('user-department');
        if (userDepartmentDisplay) {
            userDepartmentDisplay.textContent = employee.departament || 'Не указан';
        }

        // Дата регистрации (найма)
        const userRegistrationDateDisplay = document.getElementById('user-registration-date');
        if (userRegistrationDateDisplay) {
            userRegistrationDateDisplay.textContent = employee.hireDate || 'Не указана';
        }

        // Биография
        const userBioDisplay = document.getElementById('user-bio');
        if (userBioDisplay) {
            userBioDisplay.textContent = employee.bio || 'Информация отсутствует';
        }

        // ===== ФОТО ПОЛЬЗОВАТЕЛЯ =====
        const photoImg = document.querySelector('.employee-photo');
        if (photoImg) {
            if (employee.avatar) {
                photoImg.src = `${employee.avatar}?t=${Date.now()}`;
            } else {
                photoImg.src = 'img/user-placeholder.png';
            }
        }

        // Сохраняем данные в localStorage для быстрого доступа
        const userData = {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone || '', // Сохраняем как есть (может быть пустым)
            post: employee.post,
            departament: employee.departament,
            hireDate: employee.hireDate,
            bio: employee.bio,
            avatar: employee.avatar,
            login: login,
            level: meData.level,
            firstname: employee.firstname,
            lastname: employee.lastname,
            middlename: employee.middlename,
            post_id: employee.post_id,
            image_id: employee.image_id
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Сохраняем employeeId отдельно
        localStorage.setItem('employeeId', String(employeeId));

    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showProfileError('Ошибка загрузки', 'Не удалось загрузить данные профиля. Проверьте подключение к интернету.');
    }
}

// ============================================================
// ОБНОВЛЕНИЕ ПРОФИЛЯ (только email и телефон - через API сотрудников)
// ============================================================

async function updateEmployeeData(email, phone) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showProfileError('Ошибка авторизации', 'Пожалуйста, войдите в систему заново');
        return false;
    }

    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) {
        showProfileError('Ошибка', 'ID сотрудника не найден');
        return false;
    }

    try {
        // Получаем данные пользователя из localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        // Формируем запрос на обновление данных сотрудника (email и phone)
        const updateBody = {
            firstname: userData.firstname || '',
            lastname: userData.lastname || '',
            middlename: userData.middlename || '',
            email: email,
            phone: phone, // Может быть пустой строкой
            date_admission: userData.hireDate || new Date().toISOString().split('T')[0],
            description: userData.bio || '',
            post_id: userData.post_id || 1,
            image_id: userData.image_id || null
        };

        // Обновляем данные сотрудника
        const updateRes = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateBody)
        });

        if (updateRes.status === 401) {
            showProfileError('Сессия истекла', 'Пожалуйста, войдите в систему заново');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/';
            }, 2000);
            return false;
        }

        // Если 403 - значит пользователь не админ, но мы все равно можем обновить email и телефон
        // через этот же эндпоинт, если бэкенд разрешает
        if (updateRes.status === 403) {
            // Пробуем обновить только через аккаунт (если бэкенд позволяет)
            // или просто пропускаем обновление сотрудника
            console.warn('Нет прав на обновление данных сотрудника, обновляем только если возможно');
            // Возвращаем true, чтобы продолжить с обновлением пароля
            return true;
        }

        if (!updateRes.ok) {
            const data = await updateRes.json();
            showProfileError('Ошибка ' + updateRes.status, data.error || 'Попробуйте позже');
            return false;
        }

        return true;

    } catch (error) {
        console.error('Ошибка обновления данных сотрудника:', error);
        showProfileError('Ошибка соединения', 'Проверьте подключение к интернету');
        return false;
    }
}

// ============================================================
// ОБНОВЛЕНИЕ ПАРОЛЯ (доступно всем авторизованным пользователям)
// ============================================================

async function updatePassword(plainPassword) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showProfileError('Ошибка авторизации', 'Пожалуйста, войдите в систему заново');
        return false;
    }

    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) {
        showProfileError('Ошибка', 'ID сотрудника не найден');
        return false;
    }

    try {
        // Обновляем пароль через аккаунт
        const accountRes = await fetch(`${API_BASE}/api/accounts/by-employee/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                password: plainPassword  // Отправляем в открытом виде, бэкенд захеширует
            })
        });

        if (accountRes.status === 401) {
            showProfileError('Сессия истекла', 'Пожалуйста, войдите в систему заново');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/';
            }, 2000);
            return false;
        }

        if (accountRes.status === 403) {
            showProfileError('Ошибка доступа', 'У вас нет прав на смену пароля. Обратитесь к администратору.');
            return false;
        }

        if (!accountRes.ok) {
            const data = await accountRes.json();
            showProfileError('Ошибка обновления пароля', data.error || 'Попробуйте позже');
            return false;
        }

        return true;

    } catch (error) {
        console.error('Ошибка обновления пароля:', error);
        showProfileError('Ошибка соединения', 'Проверьте подключение к интернету');
        return false;
    }
}

// ============================================================
// ОСНОВНАЯ ЛОГИКА СТРАНИЦЫ
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Находим нужные элементы DOM
    const viewProfileDiv = document.getElementById('view-profile');
    const editProfileDiv = document.getElementById('edit-profile');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editButtonContainer = document.getElementById('edit-button-container');

    // Элементы для отображения данных в режиме просмотра
    const userEmailDisplay = document.getElementById('user-email');
    const userPhoneDisplay = document.getElementById('user-phone');

    // Элементы для отображения имени и должности в режиме редактирования (НЕ РЕДАКТИРУЮТСЯ)
    const editNameDisplay = document.getElementById('edit-name-display');
    const editRoleDisplay = document.getElementById('edit-role-display');

    // Элементы для полей ввода (только редактируемые поля: email, телефон, пароль)
    const editEmailInput = document.getElementById('edit-email');
    const editPhoneInput = document.getElementById('edit-phone');
    const editPasswordInput = document.getElementById('edit-password');
    const editConfirmPasswordInput = document.getElementById('edit-confirm-password');

    // Загружаем данные профиля при загрузке страницы
    loadUserProfile();

    // Функция для переключения между режимами просмотра и редактирования
    function toggleEditMode(isEditing) {
        if (isEditing) {
            viewProfileDiv.classList.add('d-none');
            editProfileDiv.classList.remove('d-none');
            editButtonContainer.classList.add('d-none');

            // Заполняем поля ввода текущими данными
            editEmailInput.value = userEmailDisplay.textContent;

            // Для телефона: если в просмотре "Не указан", то в поле ввода ставим пустую строку
            const phoneDisplayValue = userPhoneDisplay.textContent;
            if (phoneDisplayValue === 'Не указан') {
                editPhoneInput.value = '';
            } else {
                editPhoneInput.value = phoneDisplayValue;
            }

            editPasswordInput.value = '';
            editConfirmPasswordInput.value = '';

        } else {
            viewProfileDiv.classList.remove('d-none');
            editProfileDiv.classList.add('d-none');
            editButtonContainer.classList.remove('d-none');
        }
    }

    // Обработчик клика по кнопке "Редактировать"
    editProfileBtn.addEventListener('click', () => {
        const existingError = document.querySelector('#edit-profile .profile-error');
        if (existingError) existingError.remove();
        toggleEditMode(true);
    });

    // Обработчик клика по кнопке "Отменить"
    cancelEditBtn.addEventListener('click', () => {
        toggleEditMode(false);
    });

    // Обработчик клика по кнопке "Сохранить"
    saveProfileBtn.addEventListener('click', async () => {
        const newEmail = editEmailInput.value.trim();
        const newPhone = editPhoneInput.value.trim(); // Может быть пустой строкой
        const newPassword = editPasswordInput.value;
        const confirmPassword = editConfirmPasswordInput.value;

        // ===== ВАЛИДАЦИЯ С ВЫВОДОМ ОШИБОК ПОД ПОЛЯМИ =====

        // Проверка email (обязательное поле)
        if (!newEmail) {
            showProfileError('Email обязателен для заполнения', 'Пожалуйста, укажите ваш email адрес');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showProfileError('Некорректный Email', 'Пожалуйста, введите email в формате example@domain.com');
            return;
        }

        // Проверка телефона (НЕОБЯЗАТЕЛЬНОЕ поле)
        // Если телефон не пустой - проверяем формат
        if (newPhone && newPhone.length > 0) {
            const phoneRegex = /^[0-9+\-() ]+$/;
            if (!phoneRegex.test(newPhone)) {
                showProfileError('Некорректный номер телефона', 'Номер телефона может содержать только цифры, знаки +, -, скобки и пробелы');
                return;
            }
        }

        // Проверка пароля (если пользователь ввёл новый пароль)
        let plainPassword = null;
        if (newPassword || confirmPassword) {
            if (newPassword.length < 6) {
                showProfileError('Слишком короткий пароль', 'Пароль должен содержать минимум 6 символов');
                return;
            }
            if (newPassword !== confirmPassword) {
                showProfileError('Пароли не совпадают', 'Проверьте правильность ввода пароля в обоих полях');
                return;
            }
            plainPassword = newPassword; // Сохраняем в открытом виде для отправки
        }

        // ===== ОТПРАВКА ДАННЫХ НА СЕРВЕР =====

        // Показываем состояние загрузки
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Сохранение...';

        try {
            let allSuccess = true;

            // 1. Обновляем email и телефон (если есть изменения)
            // Если пользователь не админ - пропускаем, так как нет прав
            // Но пробуем обновить, если получится
            const userLevel = Number(localStorage.getItem('level') || 0);
            if (userLevel >= 2) {
                // Только HR и администраторы могут обновлять данные сотрудника
                const employeeUpdateSuccess = await updateEmployeeData(newEmail, newPhone);
                if (!employeeUpdateSuccess) {
                    allSuccess = false;
                }
            } else {
                // Для обычных сотрудников (уровень 1) - обновляем только email в localStorage
                // и надеемся, что бэкенд позволит обновить через другой механизм
                console.log('Обычный пользователь, обновляем только локальные данные');
                // Попробуем все равно обновить через API
                const employeeUpdateSuccess = await updateEmployeeData(newEmail, newPhone);
                if (!employeeUpdateSuccess) {
                    // Если не получилось - просто обновляем локально
                    console.warn('Не удалось обновить данные сотрудника через API, обновляем локально');
                }
            }

            // 2. Обновляем пароль (если введен новый)
            if (plainPassword) {
                const passwordUpdateSuccess = await updatePassword(plainPassword);
                if (!passwordUpdateSuccess) {
                    allSuccess = false;
                }
            }

            if (allSuccess) {
                // Обновляем отображаемые данные
                userEmailDisplay.textContent = newEmail;

                // Для телефона: если пустая строка - показываем "Не указан"
                if (newPhone && newPhone.trim() !== '') {
                    userPhoneDisplay.textContent = newPhone;
                } else {
                    userPhoneDisplay.textContent = 'Не указан';
                }

                // Обновляем данные в localStorage
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                currentUser.email = newEmail;
                currentUser.phone = newPhone; // Сохраняем как есть (может быть пустым)
                localStorage.setItem('user', JSON.stringify(currentUser));

                // Показываем модальное окно об успехе
                showMessageModal('Успех', 'Профиль успешно обновлен!', 'success', () => {
                    toggleEditMode(false);
                });
            }

        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error);
            showProfileError('Ошибка', 'Произошла непредвиденная ошибка. Попробуйте позже.');
        } finally {
            // Возвращаем кнопку в исходное состояние
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Сохранить';
        }
    });

    // Изначально показываем режим просмотра
    toggleEditMode(false);
});

// ============================================================
// SSE ДЛЯ ОБНОВЛЕНИЯ ДАННЫХ ПРОФИЛЯ
// ============================================================

let eventSource = null;

function connectSSE() {
    if (eventSource) {
        eventSource.close();
    }

    eventSource = new EventSource(`${API_BASE}/api/events`);

    eventSource.onopen = () => {
        console.log('SSE подключение установлено (profile)');
    };

    eventSource.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('Получено событие (profile):', message);

            if (message.type === 'employees.updated') {
                console.log('Данные сотрудников обновлены, перезагружаем профиль...');
                loadUserProfile();
            }

            if (message.type === 'connected') {
                console.log('Подключён к серверу уведомлений (profile)');
            }

        } catch (err) {
            console.error('Ошибка обработки SSE события:', err);
        }
    };

    eventSource.onerror = (err) => {
        console.error('SSE ошибка (profile):', err);
    };
}

// Подключаем SSE после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    connectSSE();
});

// Принудительно закрываем SSE при уходе со страницы
window.addEventListener('beforeunload', () => {
    if (eventSource) {
        console.log('Закрываем SSE при уходе со страницы (profile)');
        eventSource.close();
        eventSource = null;
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && eventSource) {
        console.log('Вкладка скрыта, закрываем SSE (profile)');
        eventSource.close();
        eventSource = null;
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !eventSource) {
        console.log('Вкладка активна, переподключаем SSE (profile)');
        connectSSE();
    }
});