export const rootQueries = {
  getByEmployeeId: `
    SELECT id, employee_id, level
    FROM root
    WHERE employee_id = ?;
  `,

  create: `
    INSERT INTO root (employee_id, level)
    VALUES (?, ?);
  `,

  updateLevel: `
    UPDATE root
    SET level = ?
    WHERE employee_id = ?;
  `,

  removeByEmployeeId: `
    DELETE FROM root
    WHERE employee_id = ?;
  `
} as const;
