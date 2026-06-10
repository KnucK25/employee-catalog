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
   * Возвращает id должности, название, id отдела.
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
  `,

  /**
   * Принимает название должности.
   * Возвращает id должности или undefined/null.
   */
  existByNameExceptId: `
  SELECT id FROM post
  WHERE name = ?
  `,

  getByDepId: `
  SELECT id, name, departament_id FROM post
  WHERE departament_id = ?
  `

} as const;
