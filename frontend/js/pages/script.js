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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!login || !password) { alert('Заполните все поля'); return; }

            try {
                const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
                const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'Ошибка входа');
                    return;
                }

                localStorage.setItem('authToken', data.token);
                const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if (modal) modal.hide();
                loginForm.reset();
                alert('Вход выполнен');
            } catch (err) {
                alert('Ошибка сети при входе');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirmPassword').value;

            if (!login || !password || !confirm) { alert('Заполните все поля'); return; }
            if (password !== confirm) { alert('Пароли не совпадают'); return; }

            try {
                const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
                const res = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, password })
                });

                const data = await res.json();
                if (!res.ok) { alert(data.error || 'Ошибка регистрации'); return; }

                alert('Аккаунт создан. Теперь войдите.');
                registerForm.reset();
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                modalTitle.textContent = 'Вход в аккаунт';
            } catch (err) {
                alert('Ошибка сети при регистрации');
            }
        });
    }
