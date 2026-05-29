// временно
const employees = [
    { id: 1, name: "Кристина Лелуш", position: "Руководитель", department: "Управление", email: "k.lelush@staff.ru", phone: "+7 (999) 123-45-67", hireDate: "15.03.2020", bio: "Руководитель проекта...", avatar: "img/team1.png" },
    { id: 2, name: "Аманда Спирс", position: "Маркетолог", department: "Маркетинг", email: "a.spirs@staff.ru", phone: "+7 (999) 234-56-78", hireDate: "22.07.2021", bio: "Специалист по маркетингу...", avatar: "img/team3.png" },
    { id: 3, name: "Генри Крил", position: "Ассистент", department: "Административный отдел", email: "h.kril@staff.ru", phone: "+7 (999) 345-67-89", hireDate: "10.01.2023", bio: "Помощник руководителя...", avatar: "img/team4.png" }
];

function renderCatalog(employeesList) {
    const container = document.getElementById('catalogContainer');
    if (!container) return;
    
    if (!employeesList || employeesList.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">Сотрудники не найдены</div>';
        return;
    }
    
    container.innerHTML = '';
    employeesList.forEach(emp => {
        // ИСПОЛЬЗУЕМ ВАШИ КЛАССЫ ИЗ catalog.css
        container.innerHTML += `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="employee-card">
                    <div class="employee-photo">
                        <img src="${emp.avatar}" alt="${emp.name}">
                    </div>
                    <div class="employee-info">
                        <h5 class="employee-name">${emp.name}</h5>
                        <p class="employee-position">${emp.position}</p>
                        <p class="employee-department">${emp.department}</p>
                        <button class="btn btn-details">
                            <a href="card.html?id=${emp.id}">Подробнее</a>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterByDepartment(dept) {
    if (dept === 'all') renderCatalog(employees);
    else renderCatalog(employees.filter(e => e.department === dept));
}

function searchEmployees(query) {
    if (!query.trim()) renderCatalog(employees);
    else renderCatalog(employees.filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.position.toLowerCase().includes(query.toLowerCase()) ||
        e.department.toLowerCase().includes(query.toLowerCase())
    ));
}

document.addEventListener('DOMContentLoaded', () => {
    renderCatalog(employees);
    document.getElementById('departmentFilter')?.addEventListener('change', e => filterByDepartment(e.target.value));
    document.getElementById('searchInput')?.addEventListener('input', e => searchEmployees(e.target.value));
});