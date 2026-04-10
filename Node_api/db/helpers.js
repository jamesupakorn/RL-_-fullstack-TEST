/**
 * ส่ง HTTP 500 response สำหรับ database/runtime error
 * @param {import('express').Response} res
 * @param {Error} err
 */
export function handleDbError(res, err) {
  res.status(500).json({ error: err.message });
}

/**
 * ส่ง HTTP 404 response เมื่อไม่พบ record
 * @param {import('express').Response} res
 * @param {string} entityName  ชื่อ entity เช่น 'Ingredient', 'Menu'
 */
export function notFound(res, entityName) {
  res.status(404).json({ error: `${entityName} not found` });
}
