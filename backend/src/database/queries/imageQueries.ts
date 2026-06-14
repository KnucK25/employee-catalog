export const imageQueries = {

  /**
   * Принимает бинарный код изображения, миме тип изображения('jpeg', 'png', 'webp'), размер изображения.
   * Добавляет изображение в бд.
   */
  create: `
    INSERT INTO image (binary_image, mime_type, size_bytes)
    VALUES (?, ?, ?);
  `,

  /**
   * Принимает id изображения.
   * Возвращает бинарный код изображения, миме тип('jpeg', 'png', 'webp'), размер изображения.
   */
  getById: `
    SELECT id, binary_image, mime_type, size_bytes
    FROM image
    WHERE id = ?;
  `,

  /**
   * Принимает id изображения.
   * Удаляет изображение.
   */
  remove: `
    DELETE FROM image
    WHERE id = ?;
  `,

  /**
   * Принимает id профиля.
   * Возвращает id изображения.
   */
  getEmployeeImageId: `
    SELECT image_id
    FROM employee
    WHERE id = ?;
  `,

  /**
   * Принимает blob, тип, размер изображения, id изображения
   */
  update: `
  UPDATE image
  SET
    binary_image = ?,
    mime_type = ?,
    size_bytes = ?
  WHERE id = ?
  `
} as const;
