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
    const { id, precio, precio_oferta, promo_tag, disponible, imagen_url, nombre, presentacion, categoria } = body;

    if (!id) {
      return jsonResponse({ success: false, error: "El ID del producto es obligatorio" }, 400);
    }

    // Actualiza o inserta
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
        id
      ]
    );

    // Consulta el producto actualizado
    const updated = await queryTurso(env, "SELECT * FROM productos WHERE id = ?;", [id]);

    return jsonResponse({
      success: true,
      message: `Producto ${id} actualizado correctamente`,
      product: updated.rows[0] || null
    });
  } catch (err) {
    console.error("Error en /api/admin/products:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
