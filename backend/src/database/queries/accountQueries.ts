export const accountQueries = {
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

  create: `
    INSERT INTO account (login, hash, salt, employee_id)
    VALUES (?, ?, ?, ?);
  `,

  updatePassword: `
    UPDATE account
    SET hash = ?, salt = ?
    WHERE id = ?;
  `,

  removeByEmployeeId: `
    DELETE FROM account
    WHERE employee_id = ?;
  `
} as const;
