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
    const { id, precio, descuento, activo } = body;

    if (!id) {
      return jsonResponse({ success: false, error: "El ID del mercado es requerido" }, 400);
    }

    await queryTurso(
      env,
      `UPDATE mercados
       SET precio = CASE WHEN ? IS NOT NULL THEN ? ELSE precio END,
           descuento = CASE WHEN ? IS NOT NULL THEN ? ELSE descuento END,
           activo = CASE WHEN ? IS NOT NULL THEN ? ELSE activo END,
           updated_at = datetime('now')
       WHERE id = ?;`,
      [
        precio !== undefined ? precio : null,
        precio !== undefined ? precio : null,
        descuento !== undefined ? descuento : null,
        descuento !== undefined ? descuento : null,
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
