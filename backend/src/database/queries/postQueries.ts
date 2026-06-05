export const postQueries = {
  getAll: `
    SELECT id, name
    FROM post
    ORDER BY name;
  `,

  getById: `
    SELECT id, name
    FROM post
    WHERE id = ?;
  `,

  create: `
    INSERT INTO post (name)
    VALUES (?);
  `,

  update: `
    UPDATE post
    SET name = ?
    WHERE id = ?;
  `,

  remove: `
    DELETE FROM post
    WHERE id = ?;
  `
} as const;
