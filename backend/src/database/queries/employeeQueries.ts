export const employeeQueries = {
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
    WHERE employee.firstname LIKE ? COLLATE NOCASE
       OR employee.lastname LIKE ? COLLATE NOCASE
       OR employee.middlename LIKE ? COLLATE NOCASE
       OR departament.name LIKE ? COLLATE NOCASE
       OR post.name LIKE ? COLLATE NOCASE
    ORDER BY employee.lastname, employee.firstname, employee.middlename;
  `,

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

  remove: `
    DELETE FROM employee
    WHERE id = ?;
  `,

  existsByEmailExceptId: `
    SELECT id
    FROM employee
    WHERE email = ? AND id <> ?;
  `
} as const;
