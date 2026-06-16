// Функция для отображения модального окна с сообщением (оставляем для успеха)
function showMessageModal(title, message, type = 'info', callback = null) {
    // Создаем элементы модального окна
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    const modalId = `messageModal_${Date.now()}`;
    modalContainer.id = modalId;
    modalContainer.setAttribute('tabindex', '-1');
    modalContainer.setAttribute('aria-labelledby', `${modalId}Label`);
    modalContainer.setAttribute('aria-hidden', 'true');

    // Определяем стиль кнопки в зависимости от типа сообщения
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

    // Добавляем модальное окно в DOM
    document.body.appendChild(modalContainer);

    // Создаем экземпляр модального окна Bootstrap
    const modal = new bootstrap.Modal(modalContainer);
    modal.show();

    // Обработчик закрытия модального окна
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

    const errorDiv = document.createElement('div');
    errorDiv.className = 'profile-error alert alert-danger mt-3';
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

    const editProfileForm = document.getElementById('edit-profile');
    editProfileForm.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv) errorDiv.remove();
    }, 10000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Находим нужные элементы DOM
    const viewProfileDiv = document.getElementById('view-profile');
    const editProfileDiv = document.getElementById('edit-profile');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editButtonContainer = document.getElementById('edit-button-container');

    // Элементы для отображения данных в режиме просмотра
    const userNameDisplay = viewProfileDiv.querySelector('.employee-name');
    const userEmailDisplay = document.getElementById('user-email');
    const userPhoneDisplay = document.getElementById('user-phone');
    const userDepartmentDisplay = document.getElementById('user-department');
    const userRegistrationDateDisplay = document.getElementById('user-registration-date');
    const userBioDisplay = document.getElementById('user-bio');

    // Элементы для полей ввода (редактируемые)
    const editEmailInput = document.getElementById('edit-email');
    const editPhoneInput = document.getElementById('edit-phone');
    const editPasswordInput = document.getElementById('edit-password');
    const editConfirmPasswordInput = document.getElementById('edit-confirm-password');

    // Функция для переключения между режимами просмотра и редактирования
    function toggleEditMode(isEditing) {
        if (isEditing) {
            // Переход в режим редактирования
            viewProfileDiv.classList.add('d-none');
            editProfileDiv.classList.remove('d-none');
            editButtonContainer.classList.add('d-none');

            // Заполняем поля ввода текущими данными
            editEmailInput.value = userEmailDisplay.textContent;
            editPhoneInput.value = userPhoneDisplay.textContent;

            // Очищаем поля пароля
            editPasswordInput.value = '';
            editConfirmPasswordInput.value = '';

        } else {
            // Переход в режим просмотра
            viewProfileDiv.classList.remove('d-none');
            editProfileDiv.classList.add('d-none');
            editButtonContainer.classList.remove('d-none');
        }
    }

    // Обработчик клика по кнопке "Редактировать"
    editProfileBtn.addEventListener('click', () => {
        toggleEditMode(true);
    });

    // Обработчик клика по кнопке "Отменить"
    cancelEditBtn.addEventListener('click', () => {
        toggleEditMode(false);
    });

    // Обработчик клика по кнопке "Сохранить"
    saveProfileBtn.addEventListener('click', () => {
        // Получаем новые значения
        const newEmail = editEmailInput.value.trim();
        const newPhone = editPhoneInput.value.trim();
        const newPassword = editPasswordInput.value;
        const confirmPassword = editConfirmPasswordInput.value;

        // Валидация с всплывающими сообщениями
        if (!newEmail && !newPhone) {
            showProfileError('Заполните обязательные поля', 'Email и Телефон не могут быть пустыми');
            return;
        }

        if (!newEmail) {
            showProfileError('Email обязателен для заполнения', 'Пожалуйста, укажите ваш email адрес');
            return;
        }

        if (!newPhone) {
            showProfileError('Телефон обязателен для заполнения', 'Пожалуйста, укажите ваш номер телефона');
            return;
        }

        // Проверка email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showProfileError('Некорректный Email', 'Пожалуйста, введите email в формате example@domain.com');
            return;
        }

        // Проверка номера телефона (только цифры, знаки + и -)
        const phoneRegex = /^[0-9+\-() ]+$/;
        if (!phoneRegex.test(newPhone)) {
            showProfileError('Некорректный номер телефона', 'Номер телефона может содержать только цифры, знаки +, -, скобки и пробелы');
            return;
        }

        // Проверка пароля (если пользователь ввёл новый пароль)
        if (newPassword || confirmPassword) {
            if (newPassword.length < 6) {
                showProfileError('Слишком короткий пароль', 'Пароль должен содержать минимум 6 символов');
                return;
            }
            if (newPassword !== confirmPassword) {
                showProfileError('Пароли не совпадают', 'Проверьте правильность ввода пароля в обоих полях');
                return;
            }
        }

        // Здесь будет отправка данных на сервер (AJAX запрос)
        // Например:
        /*
        fetch('/api/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: newEmail,
                phone: newPhone,
                password: newPassword || undefined
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                userEmailDisplay.textContent = newEmail;
                userPhoneDisplay.textContent = newPhone;
                showMessageModal('Успех', 'Профиль успешно обновлен!', 'success', () => {
                    toggleEditMode(false);
                });
            } else {
                showProfileError('Ошибка при обновлении', data.message || 'Попробуйте позже или обратитесь в поддержку');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showProfileError('Ошибка соединения', 'Проверьте подключение к интернету');
        });
        */

        // Обновляем данные на странице (без сервера)
        userEmailDisplay.textContent = newEmail;
        userPhoneDisplay.textContent = newPhone;

        // Успех — показываем модальное окно
        showMessageModal('Успех', 'Профиль успешно обновлен!', 'success', () => {
            toggleEditMode(false);
        });
    });

    // Изначально показываем режим просмотра
    toggleEditMode(false);
});
