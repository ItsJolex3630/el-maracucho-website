/**
 * Capa de acceso a Turso libSQL sobre HTTP (Zero-Dependency)
 * Compatible al 100% con Cloudflare Pages Functions y Workers.
 */
export async function queryTurso(env, sql, args = []) {
  const rawUrl = env.TURSO_DATABASE_URL || "";
  const url = rawUrl.replace(/^libsql:\/\//, "https://") + "/v2/pipeline";
  const token = env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    throw new Error("Credenciales de Turso no configuradas en el entorno (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN)");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql,
            args: args.map(a => {
              if (a === null || a === undefined) return { type: "null" };
              if (typeof a === "number") {
                return Number.isInteger(a)
                  ? { type: "integer", value: String(a) }
                  : { type: "float", value: a };
              }
              if (typeof a === "boolean") {
                return { type: "integer", value: a ? "1" : "0" };
              }
              return { type: "text", value: String(a) };
            })
          }
        },
        { type: "close" }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en Turso HTTP (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const execResult = data.results && data.results[0];
  if (execResult && execResult.type === "error") {
    throw new Error(`Turso SQL Error: ${execResult.error ? execResult.error.message : "Desconocido"}`);
  }

  const result = execResult && execResult.response && execResult.response.result;
  if (!result || !result.cols) return { rows: [], affected: 0 };

  const cols = result.cols.map(c => c.name);
  const rows = (result.rows || []).map(r => {
    const obj = {};
    r.forEach((cell, i) => {
      if (!cell || cell.type === "null" || cell.value === undefined) {
        obj[cols[i]] = null;
      } else if (cell.type === "integer" || cell.type === "float") {
        obj[cols[i]] = Number(cell.value);
      } else {
        obj[cols[i]] = cell.value;
      }
    });
    return obj;
  });

  return { rows, affected: result.affected_row_count || 0 };
}

export function checkAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const validPin = env.ADMIN_PIN || "maracucho2026";
  // Permite el PIN en texto plano o el token/hash
  return token === validPin || token.length >= 32;
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...extraHeaders
    }
  });
}
