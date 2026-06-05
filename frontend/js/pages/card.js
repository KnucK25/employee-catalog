const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`

function getEmployeeIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

async function loadEmployeeById(id) {
    const res = await fetch(`${API_BASE}/api/employees/${id}`);

    if (!res.ok) {
        throw new Error('Сотрудник не найден');
    }

    return res.json();
}

// Отрисовка карточки
function renderCard(employee) {
    if (!employee) {
        document.querySelector('.employee-card').innerHTML = '<div class="alert alert-danger m-4">Сотрудник не найден</div>';
        return;
    }

    const photoImg = document.querySelector('.employee-photo');
    if (photoImg) {
        photoImg.src = employee.avatar || 'img/team1.png';
    }

    const nameEl = document.querySelector('.employee-name');
    if (nameEl) {
        nameEl.textContent = employee.name;
    }

    const positionEl = document.querySelector('.employee-name + p');
    if (positionEl) {
        positionEl.textContent = employee.position;
    }

    const emailValue = document.querySelector('.info-box .col-sm-6:first-child .info-value');
    if (emailValue) {
        emailValue.textContent = employee.email;
    }

    const phoneValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[1];
    if (phoneValue) {
        phoneValue.textContent = employee.phone;
    }

    const deptValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[2];
    if (deptValue) {
        deptValue.textContent = employee.department;
    }

    const dateValue = document.querySelectorAll('.info-box .col-sm-6 .info-value')[3];
    if (dateValue) {
        dateValue.textContent = employee.hireDate;
    }

    const bioValue = document.querySelector('.bio-text');
    if (bioValue) {
        bioValue.textContent = employee.bio;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const id = getEmployeeIdFromURL();

    try {
        const employee = await loadEmployeeById(id);
        renderCard(employee);
    } catch (err) {
        const card = document.querySelector('.employee-card');

        if (card) {
            card.innerHTML = '<div class="alert alert-danger m-4">Сотрудник не найден или сервер недоступен</div>';
        }
    }
});
