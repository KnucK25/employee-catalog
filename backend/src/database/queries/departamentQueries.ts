export const departamentQueries = {
  getAll: `
    SELECT id, name
    FROM departament
    ORDER BY name;
  `,

  getById: `
    SELECT id, name
    FROM departament
    WHERE id = ?;
  `,

  create: `
    INSERT INTO departament (name)
    VALUES (?);
  `,

  update: `
    UPDATE departament
    SET name = ?
    WHERE id = ?;
  `,

  remove: `
    DELETE FROM departament
    WHERE id = ?;
  `
} as const;
