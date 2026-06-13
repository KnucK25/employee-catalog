const currentPage = window.location.pathname.split('/').pop() || 'index.html';

const token = localStorage.getItem('authToken');
const level = Number(localStorage.getItem('level') || 0);

const publicPages = [
    'index.html',
    ''
];

const userPages = [
    'catalog.html',
    'card.html'
];

const adminPages = [
    'adminPanel.html'
];

if (!token || level === 0) {
    if (!publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
    }
}

if (token && level >= 1) {
    // Пользователь авторизован, можно открывать каталог и карточки
}

if (adminPages.includes(currentPage) && level < 2) {
    window.location.href = 'index.html';
}