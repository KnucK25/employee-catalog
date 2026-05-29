import { employees } from '../data/employees.js';

// Получение ID из URL
function getEmployeeIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

// Загрузка сотрудника по ID
function getEmployeeById(id) {
    return employees.find(emp => emp.id === id);
}

// Отрисовка карточки
function renderCard(employee) {
    if (!employee) {
        document.querySelector('.employee-card').innerHTML = '<div class="alert alert-danger m-4">Сотрудник не найден</div>';
        return;
    }
    
    // Фото
    const photoImg = document.querySelector('.employee-photo');
    if (photoImg) photoImg.src = employee.avatar;
    
    // Имя и должность
    const nameEl = document.querySelector('.employee-name');
    if (nameEl) nameEl.textContent = employee.name;
    
    const positionEl = document.querySelector('.employee-name + p');
    if (positionEl) positionEl.textContent = employee.position;
    
    // EMAIL
    const emailValue = document.querySelector('.info-box .col-sm-6:first-child .info-value');
    if (emailValue) emailValue.textContent = employee.email;
    
    // ТЕЛЕФОН
    const phoneValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[1];
    if (phoneValue) phoneValue.textContent = employee.phone;
    
    // ОТДЕЛ
    const deptValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[2];
    if (deptValue) deptValue.textContent = employee.department;
    
    // ДАТА НАЙМА
    const dateValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[3];
    if (dateValue) dateValue.textContent = employee.hireDate;
    
    // БИОГРАФИЯ
    const bioValue = document.querySelector('.bio-text');
    if (bioValue) bioValue.textContent = employee.bio;
}

// Загрузка при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    const id = getEmployeeIdFromURL();
    const employee = getEmployeeById(id);
    renderCard(employee);
});