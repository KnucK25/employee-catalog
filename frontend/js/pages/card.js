// import { employees } from '../data/employees.js';
// временно //////
const employees = [
    { id: 1, name: "Кристина Лелуш", position: "Руководитель", department: "Управление", email: "k.lelush@staff.ru", phone: "+7 (999) 123-45-67", hireDate: "15.03.2020", bio: "Руководитель проекта...", avatar: "img/team1.png" },
    { id: 2, name: "Аманда Спирс", position: "Маркетолог", department: "Маркетинг", email: "a.spirs@staff.ru", phone: "+7 (999) 234-56-78", hireDate: "22.07.2021", bio: "Специалист по маркетингу...", avatar: "img/team3.png" },
    { id: 3, name: "Генри Крил", position: "Ассистент", department: "Административный отдел", email: "h.kril@staff.ru", phone: "+7 (999) 345-67-89", hireDate: "10.01.2023", bio: "Помощник руководителя...", avatar: "img/team4.png" }
];
/////////////////

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
    
    const photoImg = document.querySelector('.employee-photo');
    if (photoImg) photoImg.src = employee.avatar;
    
    const nameEl = document.querySelector('.employee-name');
    if (nameEl) nameEl.textContent = employee.name;
    
    const positionEl = document.querySelector('.employee-name + p');
    if (positionEl) positionEl.textContent = employee.position;
    
    const emailValue = document.querySelector('.info-box .col-sm-6:first-child .info-value');
    if (emailValue) emailValue.textContent = employee.email;
    
    const phoneValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[1];
    if (phoneValue) phoneValue.textContent = employee.phone;
    
    const deptValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[2];
    if (deptValue) deptValue.textContent = employee.department;
    
    const dateValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[3];
    if (dateValue) dateValue.textContent = employee.hireDate;
    
    const bioValue = document.querySelector('.bio-text');
    if (bioValue) bioValue.textContent = employee.bio;
}

// Загрузка при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    const id = getEmployeeIdFromURL();
    const employee = getEmployeeById(id);
    renderCard(employee);
});