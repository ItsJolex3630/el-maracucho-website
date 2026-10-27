import { queryTurso, checkAuth, jsonResponse } from "../../_turso.js";

export async function onRequestOptions() {
  return jsonResponse({}, 204);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return jsonResponse({ success: false, error: "No autorizado." }, 401);
  }

  try {
    const body = await request.json();
    const { id, nombre, personas, duracion, precio, precio_original, descuento, items_json, activo } = body;

    if (!id) {
      return jsonResponse({ success: false, error: "El ID del mercado es requerido" }, 400);
    }

    await queryTurso(
      env,
      `UPDATE mercados
       SET nombre = CASE WHEN ? IS NOT NULL THEN ? ELSE nombre END,
           personas = CASE WHEN ? IS NOT NULL THEN ? ELSE personas END,
           duracion = CASE WHEN ? IS NOT NULL THEN ? ELSE duracion END,
           precio = CASE WHEN ? IS NOT NULL THEN ? ELSE precio END,
           precio_original = CASE WHEN ? IS NOT NULL THEN ? ELSE precio_original END,
           descuento = CASE WHEN ? IS NOT NULL THEN ? ELSE descuento END,
           items_json = CASE WHEN ? IS NOT NULL THEN ? ELSE items_json END,
           activo = CASE WHEN ? IS NOT NULL THEN ? ELSE activo END,
           updated_at = datetime('now')
       WHERE id = ?;`,
      [
        nombre !== undefined ? nombre : null,
        nombre !== undefined ? nombre : null,
        personas !== undefined ? personas : null,
        personas !== undefined ? personas : null,
        duracion !== undefined ? duracion : null,
        duracion !== undefined ? duracion : null,
        precio !== undefined ? precio : null,
        precio !== undefined ? precio : null,
        precio_original !== undefined ? precio_original : null,
        precio_original !== undefined ? precio_original : null,
        descuento !== undefined ? descuento : null,
        descuento !== undefined ? descuento : null,
        items_json !== undefined ? (typeof items_json === 'string' ? items_json : JSON.stringify(items_json)) : null,
        items_json !== undefined ? (typeof items_json === 'string' ? items_json : JSON.stringify(items_json)) : null,
        activo !== undefined ? (activo ? 1 : 0) : null,
        activo !== undefined ? (activo ? 1 : 0) : null,
        id
      ]
    );

    const updated = await queryTurso(env, "SELECT * FROM mercados WHERE id = ?;", [id]);
    return jsonResponse({ success: true, kit: updated.rows[0] || null });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
