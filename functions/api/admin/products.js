import { queryTurso, checkAuth, jsonResponse } from "../../_turso.js";

export async function onRequestOptions() {
  return jsonResponse({}, 204);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return jsonResponse({ success: false, error: "No autorizado. PIN requerido." }, 401);
  }

  try {
    const body = await request.json();
    const { id, precio, precio_oferta, promo_tag, disponible, imagen_url, nombre, presentacion, categoria, emoji, descripcion, tags } = body;

    if (!id) {
      return jsonResponse({ success: false, error: "El ID del producto es obligatorio" }, 400);
    }

    // Comprueba si el producto existe
    const existing = await queryTurso(env, "SELECT id FROM productos WHERE id = ?;", [id]);

    if (existing.rows.length === 0) {
      // Inserción de nuevo producto
      await queryTurso(
        env,
        `INSERT INTO productos (
          id, categoria, nombre, presentacion, precio, precio_oferta, promo_tag, emoji, imagen_url, disponible, orden, descripcion, tags, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 999, ?, ?, datetime('now'));`,
        [
          id,
          categoria || 'despensa',
          nombre || 'Nuevo Producto',
          presentacion || 'Unidad',
          precio !== undefined && precio !== null ? Number(precio) : 0,
          precio_oferta !== undefined && precio_oferta !== null ? Number(precio_oferta) : null,
          promo_tag || null,
          emoji || '🛒',
          imagen_url || null,
          disponible !== undefined ? (disponible ? 1 : 0) : 1,
          descripcion || '',
          tags || ''
        ]
      );
    } else {
      // Actualización de producto existente
      await queryTurso(
        env,
        `UPDATE productos 
         SET precio = CASE WHEN ? IS NOT NULL THEN ? ELSE precio END,
             precio_oferta = ?,
             promo_tag = ?,
             disponible = CASE WHEN ? IS NOT NULL THEN ? ELSE disponible END,
             imagen_url = CASE WHEN ? IS NOT NULL THEN ? ELSE imagen_url END,
             nombre = CASE WHEN ? IS NOT NULL THEN ? ELSE nombre END,
             presentacion = CASE WHEN ? IS NOT NULL THEN ? ELSE presentacion END,
             categoria = CASE WHEN ? IS NOT NULL THEN ? ELSE categoria END,
             emoji = CASE WHEN ? IS NOT NULL THEN ? ELSE emoji END,
             updated_at = datetime('now')
         WHERE id = ?;`,
        [
          precio !== undefined ? precio : null,
          precio !== undefined ? precio : null,
          precio_oferta !== undefined ? precio_oferta : null,
          promo_tag !== undefined ? promo_tag : null,
          disponible !== undefined ? (disponible ? 1 : 0) : null,
          disponible !== undefined ? (disponible ? 1 : 0) : null,
          imagen_url !== undefined ? imagen_url : null,
          imagen_url !== undefined ? imagen_url : null,
          nombre !== undefined ? nombre : null,
          nombre !== undefined ? nombre : null,
          presentacion !== undefined ? presentacion : null,
          presentacion !== undefined ? presentacion : null,
          categoria !== undefined ? categoria : null,
          categoria !== undefined ? categoria : null,
          emoji !== undefined ? emoji : null,
          emoji !== undefined ? emoji : null,
          id
        ]
      );
    }

    // Consulta el producto actualizado/creado
    const updated = await queryTurso(env, "SELECT * FROM productos WHERE id = ?;", [id]);

    return jsonResponse({
      success: true,
      message: `Producto ${id} guardado correctamente en Turso`,
      product: updated.rows[0] || null
    });
  } catch (err) {
    console.error("Error en /api/admin/products:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
