document.addEventListener('DOMContentLoaded', () => {
    // Находим нужные элементы DOM
    const viewProfileDiv = document.getElementById('view-profile');
    const editProfileDiv = document.getElementById('edit-profile');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editButtonContainer = document.getElementById('edit-button-container');

    // Элементы для отображения данных
    const userNameDisplay = viewProfileDiv.querySelector('.employee-name');
    const userEmailDisplay = document.getElementById('user-email');
    const userPhoneDisplay = document.getElementById('user-phone');
    const userDepartmentDisplay = document.getElementById('user-department');
    const userRegistrationDateDisplay = document.getElementById('user-registration-date');
    const userBioDisplay = document.getElementById('user-bio');

    // Элементы для полей ввода
    const editNameInput = document.getElementById('edit-name');
    const editRoleInput = document.getElementById('edit-role');
    const editEmailInput = document.getElementById('edit-email');
    const editPhoneInput = document.getElementById('edit-phone');
    const editDepartmentInput = document.getElementById('edit-department');
    const editRegistrationDateInput = document.getElementById('edit-registration-date');
    const editBioTextarea = document.getElementById('edit-bio');

    // Функция для переключения между режимами просмотра и редактирования
    function toggleEditMode(isEditing) {
        if (isEditing) {
            // Переход в режим редактирования
            viewProfileDiv.classList.add('d-none'); // Скрываем просмотр
            editProfileDiv.classList.remove('d-none'); // Показываем редактирование
            editButtonContainer.classList.add('d-none'); // Скрываем кнопку "Редактировать"

            // Заполняем поля ввода текущими данными (на случай, если они были изменены)
            editNameInput.value = userNameDisplay.textContent;
            editRoleInput.value = userNameDisplay.nextElementSibling.textContent; // Следующий элемент после имени - роль
            editEmailInput.value = userEmailDisplay.textContent;
            editPhoneInput.value = userPhoneDisplay.textContent;
            editDepartmentInput.value = userDepartmentDisplay.textContent;
            editRegistrationDateInput.value = userRegistrationDateDisplay.textContent; // Дата - только для чтения, но значение остается
            editBioTextarea.value = userBioDisplay.textContent;

        } else {
            // Переход в режим просмотра
            viewProfileDiv.classList.remove('d-none');
            editProfileDiv.classList.add('d-none');
            editButtonContainer.classList.remove('d-none'); // Показываем кнопку "Редактировать"
        }
    }

    // Обработчик клика по кнопке "Редактировать"
    editProfileBtn.addEventListener('click', () => {
        toggleEditMode(true); // Включаем режим редактирования
    });

    // Обработчик клика по кнопке "Отменить"
    cancelEditBtn.addEventListener('click', () => {
        // Опционально: можно сбросить значения полей ввода к исходным, если нужно
        // Для простоты, просто возвращаемся в режим просмотра
        toggleEditMode(false); // Выключаем режим редактирования
    });

    // Обработчик клика по кнопке "Сохранить"
    saveProfileBtn.addEventListener('click', () => {
        // --- Логика сохранения ---
        // Здесь вы можете добавить код для отправки данных на сервер (AJAX запрос)
        // или просто обновить отображаемые данные на странице.

        // Пример обновления отображаемых данных:
        const newName = editNameInput.value;
        const newRole = editRoleInput.value;
        const newEmail = editEmailInput.value;
        const newPhone = editPhoneInput.value;
        const newDepartment = editDepartmentInput.value;
        const newBio = editBioTextarea.value;

        userNameDisplay.textContent = newName;
        userNameDisplay.nextElementSibling.textContent = newRole; // Обновляем роль
        userEmailDisplay.textContent = newEmail;
        userPhoneDisplay.textContent = newPhone;
        userDepartmentDisplay.textContent = newDepartment;
        userBioDisplay.textContent = newBio;

        // Показываем уведомление об успешном сохранении (опционально)
        alert('Профиль успешно обновлен!');

        // После сохранения возвращаемся в режим просмотра
        toggleEditMode(false);
    });

    // Изначально показываем режим просмотра
    toggleEditMode(false);
});
