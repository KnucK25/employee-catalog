export const imageQueries = {
  create: `
    INSERT INTO image (binary_image, mime_type, size_bytes)
    VALUES (?, ?, ?);
  `,

  getById: `
    SELECT id, binary_image, mime_type, size_bytes
    FROM image
    WHERE id = ?;
  `,

  remove: `
    DELETE FROM image
    WHERE id = ?;
  `,

  getEmployeeImageId: `
    SELECT image_id
    FROM employee
    WHERE id = ?;
  `
} as const;
