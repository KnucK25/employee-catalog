export const employeeQueries = {
  /**
   * Ничего не принимает.
   * Отдает все профили со всеми вложенимя(id, firstname, lastname, middlename, email, phone, date_admission, description, departament_id, departament_name, post_id, post_name, image_id).
   */
  getAll: `
    SELECT
      employee.id,
      employee.firstname,
      employee.lastname,
      employee.middlename,
      employee.email,
      employee.phone,
      employee.date_admission,
      employee.description,
      employee.departament_id,
      departament.name AS departament_name,
      employee.post_id,
      post.name AS post_name,
      employee.image_id
    FROM employee
    INNER JOIN departament ON departament.id = employee.departament_id
    INNER JOIN post ON post.id = employee.post_id
    ORDER BY employee.lastname, employee.firstname, employee.middlename;
  `,

  /**
   * Принимает id профиля.
   * Отдает один профиль со всем содержимым
   */
  getById: `
    SELECT
      employee.id,
      employee.firstname,
      employee.lastname,
      employee.middlename,
      employee.email,
      employee.phone,
      employee.date_admission,
      employee.description,
      employee.departament_id,
      departament.name AS departament_name,
      employee.post_id,
      post.name AS post_name,
      employee.image_id
    FROM employee
    INNER JOIN departament ON departament.id = employee.departament_id
    INNER JOIN post ON post.id = employee.post_id
    WHERE employee.id = ?;
  `,

  /**
   * Принимает один параметр с ключем search: имя | фамилию | отчество | название | отдела или название должности.
   * Отдает все совпадающие профили.
   */
  search: `
    SELECT
      employee.id,
      employee.firstname,
      employee.lastname,
      employee.middlename,
      employee.email,
      employee.phone,
      employee.date_admission,
      employee.description,
      employee.departament_id,
      departament.name AS departament_name,
      employee.post_id,
      post.name AS post_name,
      employee.image_id
    FROM employee
    INNER JOIN departament ON departament.id = employee.departament_id
    INNER JOIN post ON post.id = employee.post_id
    WHERE employee.firstname LIKE :search COLLATE NOCASE
       OR employee.lastname LIKE :search COLLATE NOCASE
       OR employee.middlename LIKE :search COLLATE NOCASE
       OR departament.name LIKE :search COLLATE NOCASE
       OR post.name LIKE :search COLLATE NOCASE
    ORDER BY employee.lastname, employee.firstname, employee.middlename;
  `,

  /**
   * Принимает id отдела.
   * Возвращает все профили относящиеся к выбранному отделу.
   */
  filterByDepartamentId: `
    SELECT
      employee.id,
      employee.firstname,
      employee.lastname,
      employee.middlename,
      employee.email,
      employee.phone,
      employee.date_admission,
      employee.description,
      employee.departament_id,
      departament.name AS departament_name,
      employee.post_id,
      post.name AS post_name,
      employee.image_id
    FROM employee
    INNER JOIN departament ON departament.id = employee.departament_id
    INNER JOIN post ON post.id = employee.post_id
    WHERE employee.departament_id = ?
    ORDER BY employee.lastname, employee.firstname, employee.middlename;
  `,

  /**
   * Принимает имя, фамилию, отчество, емайл, телефон, дату создания, описание, id отдела, id должности, id фотографии.
   * Создает профиль.
   */
  create: `
    INSERT INTO employee (
      firstname,
      lastname,
      middlename,
      email,
      phone,
      date_admission,
      description,
      departament_id,
      post_id,
      image_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  /**
   * Принимает имя, фамилию, отчество, емайл, телефон, дату создания, описание, id отдела, id должности, id фотографии, id аккаунта.
   * Обновляет существующий профиль.
   */
  update: `
    UPDATE employee
    SET
      firstname = ?,
      lastname = ?,
      middlename = ?,
      email = ?,
      phone = ?,
      date_admission = ?,
      description = ?,
      departament_id = ?,
      post_id = ?,
      image_id = ?
    WHERE id = ?;
  `,

  /**
   * Принимает id профиля.
   * Удаляет профиль.
   */
  remove: `
    DELETE FROM employee
    WHERE id = ?;
  `,

  /**
   * Принимает новый емайл и id текущего пользователя.
   * Если вернул не null/undefined значит такой емайл уже занят, иначе можно использовать новый емайл.
   */
  existsByEmailExceptId: `
    SELECT id
    FROM employee
    WHERE email = ? AND id <> ?;
  `
} as const;
