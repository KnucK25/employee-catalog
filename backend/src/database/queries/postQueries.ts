export const postQueries = {

  /**
   * Ничего не принимает.
   * Возвращает все должности(id, name)
   */
  getAll: `
    SELECT id, name
    FROM post
    ORDER BY name;
  `,

  /**
   * Принимает id должности.
   * Возвращает id должности, название.
   */
  getById: `
    SELECT id, name
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
    SET name = ?
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
