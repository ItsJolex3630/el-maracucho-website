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
    const { clave, valor } = await request.json();

    if (!clave) {
      return jsonResponse({ success: false, error: "Clave requerida" }, 400);
    }

    await queryTurso(
      env,
      "INSERT OR REPLACE INTO configuracion (clave, valor, updated_at) VALUES (?, ?, datetime('now'));",
      [clave, String(valor)]
    );

    return jsonResponse({ success: true, clave, valor });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
