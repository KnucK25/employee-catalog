// Переключение между формами входа и регистрации
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    const modalTitle = document.getElementById('authModalLabel');

//шифрование пароля
async function getPublicKey() {
    const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
    const res = await fetch(`${API_BASE}/api/auth/public-key`);
    const data = await res.json();
    return data.publicKey;
}

async function encryptPassword(password) {
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
        {
            name: 'RSA-OAEP'
        },
        publicKey,
        encodedPassword
    );

    return arrayBufferToBase64(encrypted);
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
            } catch (err) {
                alert('Ошибка сети при входе'+err);
            }
        });
    }

    // Обработка авторизации (без шифрования) ВРЕМЕННО
   /* if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!login || !password) {
                alert('Заполните все поля');
                return;
            }

            try {
                const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
                
                // Отправляем пароль без шифрования
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
                localStorage.setItem('level', data.level);
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if (modal) modal.hide();
                loginForm.reset();
                alert('Вход выполнен');
            } catch (err) {
                console.error('Ошибка:', err);
                alert('Ошибка сети при входе');
            }
        });
    }
        */

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