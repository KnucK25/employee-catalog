export const accountQueries = {
  /**
   * Принимает логин.
   * Отдает аккаунт(id, login, hash, salt, emloyee_id, root.level).
   */
  getByLogin: `
    SELECT
      account.id,
      account.login,
      account.hash,
      account.salt,
      account.employee_id,
      root.level
    FROM account
    LEFT JOIN root ON root.employee_id = account.employee_id
    WHERE account.login = ?;
  `,

  /**
   * Принимает логин, хэш, соль, id профиля.
   * Создает аккаунт для входа.
   */
  create: `
    INSERT INTO account (login, hash, salt, employee_id)
    VALUES (?, ?, ?, ?);
  `,

  /**
   * Принимает хэш, соль, id аккаунта.
   * Обновляет хэш и соль существующего аккаунта.
   */
  updatePassword: `
    UPDATE account
    SET hash = ?, salt = ?
    WHERE id = ?;
  `,

  /**
   * Принимает employee_id.
   * Отдает аккаунт сотрудника (id, login, employee_id).
   */
  getByEmployeeId: `
    SELECT id, login, employee_id
    FROM account
    WHERE employee_id = ?;
  `,

  /**
   * Принимает логин, employee_id.
   * Обновляет логин аккаунта.
   */
  updateLogin: `
    UPDATE account
    SET login = ?
    WHERE employee_id = ?;
  `,

  /**
   * Принимает id аккаунта.
   * Удаляет аккаунт.
   */
  removeByEmployeeId: `
    DELETE FROM account
    WHERE employee_id = ?;
  `
} as const;
