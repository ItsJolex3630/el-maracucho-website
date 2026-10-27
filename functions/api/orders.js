import { queryTurso, jsonResponse } from "../_turso.js";

export async function onRequestOptions() {
  return jsonResponse({}, 204);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const order = await request.json();
    const id = order.id || "ped_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    await queryTurso(
      env,
      `INSERT INTO pedidos (
        id, cliente_nombre, cliente_telefono, metodo, direccion, cuando, forma_pago, notas, items_json, total_usd, tasa_bcv, total_bs, estado, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', datetime('now'), datetime('now'));`,
      [
        id,
        order.cliente_nombre || order.name || "Cliente",
        order.cliente_telefono || order.phone || "",
        order.metodo || order.mode || "delivery",
        order.direccion || order.addr || "",
        order.cuando || order.when || "Lo antes posible",
        order.forma_pago || order.pay || "Efectivo $",
        order.notas || order.note || "",
        typeof order.items === "string" ? order.items : JSON.stringify(order.items || []),
        Number(order.total_usd || order.total || 0),
        Number(order.tasa_bcv || order.rate || 0),
        Number(order.total_bs || 0)
      ]
    );

    return jsonResponse({
      success: true,
      message: "Pedido registrado con éxito",
      orderId: id
    });
  } catch (err) {
    console.error("Error guardando pedido:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
