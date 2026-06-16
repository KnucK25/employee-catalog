const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const token = localStorage.getItem('authToken');
const level = Number(localStorage.getItem('level') || 0);

const publicPages = [
    'index.html',
    '',
    'notFound.html'
];

const authPages = [
    'catalog.html',
    'profile.html'
];

// Только для администраторов (level >= 3)
const adminOnlyPages = [
    'accessPanel.html'
];

// Для HR и администраторов (level >= 2)
const hrPages = [
    'adminPanel.html'
];

// card.html доступен только с id и токеном
if (currentPage === 'card.html') {
    const hasId = new URLSearchParams(window.location.search).has('id');
    if (!hasId && !token) {
        window.location.href = 'index.html';
    }
}

// Если не авторизован
if (!token || level === 0) {
    if (!publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
    }
    // Если авторизован
} else if (level >= 1) {
    // Страницы только для администраторов (уровень >= 3)
    if (adminOnlyPages.includes(currentPage) && level < 3) {
        window.location.href = 'index.html';
    }
    // Страницы для HR и администраторов (уровень >= 2)
    if (hrPages.includes(currentPage) && level < 2) {
        window.location.href = 'index.html';
    }
}
