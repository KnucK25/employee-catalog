function updateNavigation() {
    const token = localStorage.getItem('authToken');
    const level = Number(localStorage.getItem('level') || 0);
    
    const navList = document.querySelector('.navbar-nav.ms-auto');
    if (!navList) return;
    
    const isAuth = token && level > 0;
    const isAdmin = level >= 2; 
    
    navList.innerHTML = '';
    
    // 1. Главная (всегда)
    addNavItem(navList, 'Главная', 'index.html');
    
    // 2. Каталог сотрудников (только для авторизованных)
    if (isAuth) {
        addNavItem(navList, 'Каталог сотрудников', 'catalog.html');
    }
    
    // 3. Админ панель (только для администраторов)
    if (isAdmin) {
        addNavItem(navList, 'Админ панель', 'adminPanel.html');
    }
    
    // 4. Профиль (только для авторизованных)
    if (isAuth) {
        addNavItem(navList, 'Профиль', 'profile.html');
    }
    
    // 5. Кнопка авторизации или выхода
    if (isAuth) {
        // Кнопка "Выйти"
        const logoutItem = document.createElement('li');
        logoutItem.className = 'nav-item';
        logoutItem.innerHTML = '<a class="nav-link" href="#" onclick="logout(); return false;">Выйти</a>';
        navList.appendChild(logoutItem);
    } else {
        // Кнопка "Авторизация" (открывает модальное окно)
        const loginItem = document.createElement('li');
        loginItem.className = 'nav-item';
        loginItem.innerHTML = '<a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#authModal">Авторизация</a>';
        navList.appendChild(loginItem);
    }
}

// Вспомогательная функция для добавления пункта меню
function addNavItem(container, text, href) {
    const li = document.createElement('li');
    li.className = 'nav-item';
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isActive = (currentPage === href);
    
    li.innerHTML = `<a class="nav-link ${isActive ? 'active' : ''}" href="${href}">${text}</a>`;
    container.appendChild(li);
}

// Функция выхода из системы
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('level');
    localStorage.removeItem('employeeId');
    
    updateNavigation();
    
    const authModal = document.getElementById('authModal');
    if (authModal) {
        const modal = bootstrap.Modal.getInstance(authModal);
        if (modal) modal.hide();
    }
    
    window.location.href = 'index.html';
}

// Обновление навигации после успешного входа
function onLoginSuccess(level) {
    localStorage.setItem('level', level);
    updateNavigation();
}

document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            setTimeout(() => {
                updateNavigation();
            }, 200);
        });
    }
});