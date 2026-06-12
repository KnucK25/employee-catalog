const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`

// interface Employee{
//     id: number,
//     name: string,
//     firstname: string,
//     lastname: string,
//     middlename: string,
//     post: string,
//     departament: string,
//     departament_id: number,
//     post_id: number,
//     email: string,
//     phone: string,
//     hireDate: string,
//     bio: string,
//     avatar: href,
//     image_id: number
// }
// type Employees = [Employee]

// interface Departament{
//     id: number,
//     name: string
// }
// type Departaments = [Departament]

// interface Post{
//     id: number,
//     departament_id: number,
//     name: string 
// }
// type Posts = [Post]

let employees = [];
let departamentsList = [];
let postsList = [];

function populateDepartamentFilter() {
    const filter = document.getElementById('departamentFilter')
    if (!filter) return;
    const saveValue = filter.value
    filter.innerHTML = ''
    const allOpt = document.createElement('option')
    allOpt.value = 'all'
    allOpt.textContent = 'Все отделы'
    allOpt.selected = saveValue === 'all'
    filter.appendChild(allOpt);
    departamentsList.forEach(dep => {
        const Opt = document.createElement('option');
        Opt.value = dep.id
        Opt.textContent = dep.name
        if (saveValue !=='all') Opt.selected = Number(saveValue)===dep.id
        filter.appendChild(Opt);
    });
}

function populatePostFilter(dep_id) {
    const filter = document.getElementById('postFilter')
    if (!filter) return;
    const saveValue = filter.value
    filter.innerHTML = ''
    const allOpt = document.createElement('option')
    allOpt.value = 'all'
    allOpt.textContent = 'Все должности'
    allOpt.selected = saveValue === 'all'
    filter.appendChild(allOpt);
    let Posts = postsList
    if (dep_id!='all') {
        Posts = postsList.filter(function(e){return e.departament_id === Number(dep_id)})
    }
    Posts.forEach(post => {
        const Opt = document.createElement('option');
        Opt.value = post.id
        Opt.textContent = post.name
        if (saveValue!=='all') Opt.selected = Number(saveValue)===post.id
        filter.appendChild(Opt);
    });
}

async function loadEmployees() {
    try {
        const [employeesRes, departamentsRes, postsRes] = await Promise.all([
            fetch(`${API_BASE}/api/employees`),
            fetch(`${API_BASE}/api/departaments`),
            fetch(`${API_BASE}/api/posts`)
        ]);
        
        if (!employeesRes.ok) throw new Error('Ошибка сервера');
        
        // Парсим все ответы
        employees = await employeesRes.json();
        departamentsList = await departamentsRes.json();
        postsList = await postsRes.json();

        populateDepartamentFilter()
        populatePostFilter('all')
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
                        <img src="${emp.avatar || 'img/bio.png'}" alt="${emp.name}">
                    </div>
                    <div class="employee-info">
                        <h5 class="employee-name">${emp.name}</h5>
                        <p class="employee-position">${emp.post}</p>
                        <p class="employee-department">${emp.departament}</p>
                        <button class="btn btn-details">
                            <a href="card.html?id=${emp.id}">Подробнее</a>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filter_and_search() {
    populatePostFilter(document.getElementById('departamentFilter').value)
    const filteredByDepartament = employees.filter(function (emp) {
        if (document.getElementById('departamentFilter').value === 'all') return true
        return emp.departament_id === Number(document.getElementById('departamentFilter').value)
    })
    
    const filteredByPost = filteredByDepartament.filter(function (emp) {
        if (document.getElementById('postFilter').value === 'all') return true
        return emp.post_id === Number(document.getElementById('postFilter').value)
    })
    
    const searched = filteredByPost.filter(function (emp) {
        q = document.getElementById('searchInput').value.toLowerCase()
        const inName = emp.name.toLowerCase().includes(q)
        const inPost = emp.post.toLowerCase().includes(q)
        const inDepartament = emp.departament.toLowerCase().includes(q)
        return inName || inPost || inDepartament
    })
    
    renderCatalog(searched)
    
}

document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    document.getElementById('departamentFilter')?.addEventListener('change', filter_and_search);
    document.getElementById('postFilter')?.addEventListener('change', filter_and_search);
    document.getElementById('searchInput')?.addEventListener('input', filter_and_search);
});