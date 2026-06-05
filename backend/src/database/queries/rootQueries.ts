export const rootQueries = {

  /**
   * Принимает id профиля.
   * Возвращает id прав, id профиля, уровень прав.
   */
  getByEmployeeId: `
    SELECT id, employee_id, level
    FROM root
    WHERE employee_id = ?;
  `,

  /**
   * Принимает id профиля, уровень прав.
   * Создает новое правило для прав сотрудника.
   */
  create: `
    INSERT INTO root (employee_id, level)
    VALUES (?, ?);
  `,

  /**
   * Принимает уровень прав, id профиля.
   * Изменяет уровень прав выбранного пользователя.
   */
  updateLevel: `
    UPDATE root
    SET level = ?
    WHERE employee_id = ?;
  `,

  /**
   * Принимает id профиля.
   * Удаляет запись о правах выбранного профиля.
   */
  removeByEmployeeId: `
    DELETE FROM root
    WHERE employee_id = ?;
  `
} as const;
