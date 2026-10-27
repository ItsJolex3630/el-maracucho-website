import { queryTurso, checkAuth, jsonResponse } from "../../_turso.js";

export async function onRequestOptions() {
  return jsonResponse({}, 204);
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return jsonResponse({ success: false, error: "No autorizado." }, 401);
  }

  try {
    const ordersRes = await queryTurso(
      env,
      "SELECT id, cliente_nombre, cliente_telefono, metodo, direccion, cuando, forma_pago, notas, items_json, total_usd, tasa_bcv, total_bs, estado, created_at, updated_at FROM pedidos ORDER BY datetime(created_at) DESC LIMIT 100;"
    );

    const orders = (ordersRes.rows || []).map(o => {
      let items = [];
      try { items = JSON.parse(o.items_json); } catch (e) {}
      return {
        ...o,
        items
      };
    });

    return jsonResponse({ success: true, count: orders.length, orders });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return jsonResponse({ success: false, error: "No autorizado." }, 401);
  }

  try {
    const body = await request.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return jsonResponse({ success: false, error: "ID y estado son requeridos" }, 400);
    }

    await queryTurso(
      env,
      "UPDATE pedidos SET estado = ?, updated_at = datetime('now') WHERE id = ?;",
      [estado, id]
    );

    return jsonResponse({ success: true, id, estado });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
