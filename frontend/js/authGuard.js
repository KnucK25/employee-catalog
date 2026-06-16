// const currentPage = window.location.pathname.split('/').pop() || 'index.html';

// const token = localStorage.getItem('authToken');
// const level = Number(localStorage.getItem('level') || 0);

// const publicPages = [
//     'index.html',
//     ''
// ];

// const userPages = [
//     'catalog.html',
//     'card.html'
// ];

// const adminPages = [
//     'adminPanel.html'
// ];

// if (!token || level === 0) {
//     if (!publicPages.includes(currentPage)) {
//         window.location.href = 'index.html';
//     }
// }

// if (token && level >= 1) {
//     // Пользователь авторизован, можно открывать каталог и карточки
// }

// if (adminPages.includes(currentPage) && level < 2) {
//     window.location.href = 'index.html';
// }


/*

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

const adminPages = [
    'adminPanel.html',
    'accessPanel.html'
];

if (currentPage === 'card.html') {
    const hasId = new URLSearchParams(window.location.search).has('id');
    if (!hasId && !token) {
        window.location.href = 'index.html';
    }
}

if (!token || level === 0) {
    if (!publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
    }
} else if (level >= 1) {
    if (adminPages.includes(currentPage) && level < 2) {
        window.location.href = 'index.html';
    }
}

*/