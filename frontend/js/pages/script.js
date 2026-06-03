    // Переключение между формами входа и регистрации
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    const modalTitle = document.getElementById('authModalLabel');

    // Показать форму регистрации
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            modalTitle.textContent = 'Регистрация';
        });
    }

    // Показать форму входа
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            modalTitle.textContent = 'Вход в аккаунт';
        });
    }

    // Обработка авторизации (временная заглушка)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Простая имитация авторизации (потом замените на реальную)
            if (email && password) {
                alert(`Вход выполнен как ${email}`);
                // Закрыть модальное окно
                const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if (modal) modal.hide();
                // Очистить форму
                loginForm.reset();
            } else {
                alert('Заполните все поля');
            }
        });
    }

    // Обработка регистрации (временная заглушка)
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirmPassword').value;
            
            if (!name || !email || !password || !confirm) {
                alert('Заполните все поля');
                return;
            }
            if (password !== confirm) {
                alert('Пароли не совпадают');
                return;
            }
            
            alert(`Регистрация выполнена как ${name}`);
            // Закрыть модальное окно и вернуться к форме входа
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (modal) modal.hide();
            registerForm.reset();
            loginForm.reset();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            modalTitle.textContent = 'Вход в аккаунт';
        });
    }
