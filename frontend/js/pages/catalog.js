const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`

let employees = [];

async function loadEmployees() {
    try {
        const res = await fetch(`${API_BASE}/api/employees`);

        if (!res.ok) {
            throw new Error('Ошибка сервера');
        }

        employees = await res.json();
        renderCatalog(employees);
    } catch (err) {
        const container = document.getElementById('catalogContainer');

        if (container) {
            container.innerHTML = '<div class="col-12 text-center text-danger py-5">Не удалось загрузить сотрудников. Проверьте, запущен ли сервер.</div>';
        }
    }
}

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
                        <img src="${emp.avatar || 'img/team1.png'}" alt="${emp.name}">
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
    if (dept === 'all') {
        renderCatalog(employees);
    } else {
        renderCatalog(employees.filter(e => e.department === dept));
    }
}

function searchEmployees(query) {
    if (!query.trim()) {
        renderCatalog(employees);
    } else {
        renderCatalog(employees.filter(e =>
            e.name.toLowerCase().includes(query.toLowerCase()) ||
            e.position.toLowerCase().includes(query.toLowerCase()) ||
            e.department.toLowerCase().includes(query.toLowerCase())
        ));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    document.getElementById('departmentFilter')?.addEventListener('change', e => filterByDepartment(e.target.value));
    document.getElementById('searchInput')?.addEventListener('input', e => searchEmployees(e.target.value));
});