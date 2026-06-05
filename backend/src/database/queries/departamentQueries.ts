export const departamentQueries = {

  /**
   * Ничего не принимает.
   * Возвращает 
   */
  getAll: `
    SELECT id, name
    FROM departament
    ORDER BY name;
  `,

  /**
   * Принимает id отдела.
   * Возвращает id отдела и название отдела.
   */
  getById: `
    SELECT id, name
    FROM departament
    WHERE id = ?;
  `,

  /**
   * Принимает название отдела.
   * Создает новый отдел
   */
  create: `
    INSERT INTO departament (name)
    VALUES (?);
  `,

  /**
   * Принимает название отдела, id отдела.
   * Обновляет название отдела по id.
   */
  update: `
    UPDATE departament
    SET name = ?
    WHERE id = ?;
  `,

  /**
   * Принимает id отдела.
   * Удаляет отдел.
   */
  remove: `
    DELETE FROM departament
    WHERE id = ?;
  `
} as const;
