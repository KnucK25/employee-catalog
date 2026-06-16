function updateNavigation() {
    const token = localStorage.getItem('authToken');
    const level = Number(localStorage.getItem('level') || 0);
    
    const navList = document.querySelector('.navbar-nav.ms-auto');
    if (navList) {
        const isAuth = token && level > 0;
        const isHR = level >= 2;          
        const isSuperAdmin = level >= 3;  
        
        navList.innerHTML = '';
        
        addNavItem(navList, 'Главная', 'index.html');
        
        if (isAuth) {
            addNavItem(navList, 'Каталог сотрудников', 'catalog.html');
        }
        
        if (isHR) {
            addNavItem(navList, 'Админ панель', 'adminPanel.html');
        }
        
        if (isSuperAdmin) {
            addNavItem(navList, 'Права доступа', 'accessPanel.html');
        }
        
        if (isAuth) {
            addNavItem(navList, 'Профиль', 'profile.html');
        }
        
        if (isAuth) {
            const logoutItem = document.createElement('li');
            logoutItem.className = 'nav-item';
            logoutItem.innerHTML = '<a class="nav-link logout-btn" href="#" onclick="logout(); return false;">Выйти</a>';
            navList.appendChild(logoutItem);
        } else {
            const loginItem = document.createElement('li');
            loginItem.className = 'nav-item';
            loginItem.innerHTML = '<a class="nav-link auth-btn" href="#" data-bs-toggle="modal" data-bs-target="#authModal">Авторизация</a>';
            navList.appendChild(loginItem);
        }
    }
    
    updateHeroButton();
    
    const catalogBtn = document.getElementById('catalogBtn');
    if (catalogBtn) {
        catalogBtn.removeEventListener('click', handleCatalogClick);
        catalogBtn.addEventListener('click', handleCatalogClick);
    }
}


// Функция для обновления кнопки в hero-секции
function updateHeroButton() {
    const token = localStorage.getItem('authToken');
    const level = Number(localStorage.getItem('level') || 0);
    const isAuth = token && level > 0;
    
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    if (!heroLoginBtn) return;
    
    if (isAuth) {
        heroLoginBtn.textContent = 'Выйти';
        heroLoginBtn.removeAttribute('data-bs-toggle');
        heroLoginBtn.removeAttribute('data-bs-target');
        heroLoginBtn.onclick = function(e) {
            e.preventDefault();
            logout();
        };
    } else {
        heroLoginBtn.textContent = 'Войти';
        heroLoginBtn.setAttribute('data-bs-toggle', 'modal');
        heroLoginBtn.setAttribute('data-bs-target', '#authModal');
        heroLoginBtn.onclick = null;
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

function onLoginSuccess(level) {
    localStorage.setItem('level', level);
    updateNavigation();
}

// Инициализация при загрузке страницы
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

// Функция проверки авторизации и перенаправления на каталог
function handleCatalogClick(event) {
    const token = localStorage.getItem('authToken');
    const level = Number(localStorage.getItem('level') || 0);
    const isAuth = token && level > 0;
    
    if (!isAuth) {
        event.preventDefault();
        showAuthRequiredModal();
    }
}

// Функция показа модального окна с сообщением о необходимости авторизации
function showAuthRequiredModal() {
    let modal = document.getElementById('authRequiredModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'authRequiredModal';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Требуется авторизация</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <p class="mb-3">Для просмотра каталога сотрудников необходимо авторизоваться.</p>
                        <p class="text-muted small">Пожалуйста, войдите в систему или зарегистрируйтесь.</p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-dark" id="goToAuthBtn">Авторизоваться</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const goToAuthBtn = document.getElementById('goToAuthBtn');
        if (goToAuthBtn) {
            goToAuthBtn.addEventListener('click', () => {
                const currentModal = bootstrap.Modal.getInstance(modal);
                if (currentModal) currentModal.hide();
                
                const authModal = new bootstrap.Modal(document.getElementById('authModal'));
                authModal.show();
            });
        }
        
        modal.addEventListener('hidden.bs.modal', function() {
            modal.remove();
        });
    }
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}
