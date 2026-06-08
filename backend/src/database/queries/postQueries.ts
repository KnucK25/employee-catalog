export const postQueries = {

  /**
   * Ничего не принимает.
   * Возвращает все должности(id, name)
   */
  getAll: `
    SELECT id, name, departament_id
    FROM post
    ORDER BY name;
  `,

  /**
   * Принимает id должности.
   * Возвращает id должности, название.
   */
  getById: `
    SELECT id, name, departament_id
    FROM post
    WHERE id = ?;
  `,

  /**
   * Принимает id отдела, название должности.
   * Создает новую должность.
   */
  create: `
    INSERT INTO post (departament_id, name)
    VALUES (?, ?);
  `,

  /**
   * Принимает название должности, id должности.
   * Обновляет существующую должность
   */
  update: `
    UPDATE post
    SET name = ?, departament_id = ?
    WHERE id = ?;
  `,

  /**
   * Принимает id должности.
   * Удаляет должность.
   */
  remove: `
    DELETE FROM post
    WHERE id = ?;
  `
} as const;
