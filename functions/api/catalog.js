import { queryTurso, jsonResponse } from "../_turso.js";

export async function onRequestOptions() {
  return jsonResponse({}, 204);
}

export async function onRequestGet(context) {
  try {
    const { env } = context;

    // Obtiene productos ordenados
    const productsRes = await queryTurso(
      env,
      "SELECT id, categoria, nombre, presentacion, precio, precio_oferta, promo_tag, emoji, imagen_url, disponible, orden, descripcion, tags, updated_at FROM productos ORDER BY orden ASC;"
    );

    // Obtiene mercados (kits)
    const kitsRes = await queryTurso(
      env,
      "SELECT id, nombre, precio, precio_original, descuento, duracion, personas, items_json, activo FROM mercados WHERE activo = 1;"
    );

    // Obtiene ajustes (tasa bcv u otros)
    const configRes = await queryTurso(
      env,
      "SELECT clave, valor FROM configuracion;"
    );

    const configMap = {};
    (configRes.rows || []).forEach(c => {
      configMap[c.clave] = c.valor;
    });

    const parsedKits = (kitsRes.rows || []).map(k => {
      let items = [];
      try { items = JSON.parse(k.items_json); } catch (e) {}
      return {
        ...k,
        items
      };
    });

    return jsonResponse({
      success: true,
      count: productsRes.rows.length,
      products: productsRes.rows,
      kits: parsedKits,
      config: configMap,
      updatedAt: new Date().toISOString()
    }, 200, {
      "Cache-Control": "public, max-age=10, s-maxage=30, stale-while-revalidate=60"
    });
  } catch (err) {
    console.error("Error en /api/catalog:", err);
    return jsonResponse({
      success: false,
      error: err.message || "Error al consultar el catálogo"
    }, 500);
  }
}
