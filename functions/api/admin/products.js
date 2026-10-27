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
    const {
      id,
      action,
      precio,
      precio_oferta,
      promo_tag,
      disponible,
      imagen_url,
      nombre,
      presentacion,
      categoria,
      emoji,
      descripcion,
      tags
    } = body;

    if (!id) {
      return jsonResponse({ success: false, error: "El ID del producto es obligatorio" }, 400);
    }

    if (action === "delete") {
      await queryTurso(env, "DELETE FROM productos WHERE id = ?;", [id]);
      return jsonResponse({
        success: true,
        deleted: id,
        message: `Producto ${id} eliminado de Turso`
      });
    }

    const existing = await queryTurso(env, "SELECT * FROM productos WHERE id = ?;", [id]);

    if (existing.rows.length === 0) {
      await queryTurso(
        env,
        `INSERT INTO productos (
          id, categoria, nombre, presentacion, precio, precio_oferta, promo_tag, emoji, imagen_url, disponible, orden, descripcion, tags, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 999, ?, ?, datetime('now'));`,
        [
          id,
          categoria || "despensa",
          nombre || "Nuevo Producto",
          presentacion || "Unidad",
          precio !== undefined && precio !== null ? Number(precio) : 0,
          precio_oferta !== undefined && precio_oferta !== null && precio_oferta !== "" ? Number(precio_oferta) : null,
          promo_tag || null,
          emoji || "🛒",
          imagen_url || null,
          disponible !== undefined ? (disponible ? 1 : 0) : 1,
          descripcion || "",
          tags || ""
        ]
      );
    } else {
      const cur = existing.rows[0];
      const nextPrecio = precio !== undefined && precio !== null ? Number(precio) : Number(cur.precio);
      const nextOferta = "precio_oferta" in body
        ? (precio_oferta !== null && precio_oferta !== "" ? Number(precio_oferta) : null)
        : (cur.precio_oferta !== null && cur.precio_oferta !== undefined ? Number(cur.precio_oferta) : null);
      const nextTag = "promo_tag" in body
        ? (promo_tag ? String(promo_tag).trim() : null)
        : (cur.promo_tag || null);
      const nextDisp = disponible !== undefined && disponible !== null
        ? (disponible ? 1 : 0)
        : (cur.disponible !== undefined && cur.disponible !== null ? Number(cur.disponible) : 1);
      const nextImg = "imagen_url" in body
        ? (imagen_url ? String(imagen_url).trim() : null)
        : (cur.imagen_url || null);
      const nextNombre = nombre !== undefined && nombre !== null && String(nombre).trim()
        ? String(nombre).trim()
        : cur.nombre;
      const nextPres = presentacion !== undefined && presentacion !== null
        ? String(presentacion).trim()
        : cur.presentacion;
      const nextCat = categoria !== undefined && categoria !== null && String(categoria).trim()
        ? String(categoria).trim()
        : cur.categoria;
      const nextEmoji = emoji !== undefined && emoji !== null && String(emoji).trim()
        ? String(emoji).trim()
        : (cur.emoji || "🛒");
      const nextDesc = descripcion !== undefined && descripcion !== null
        ? String(descripcion).trim()
        : (cur.descripcion || "");
      const nextTags = tags !== undefined && tags !== null
        ? String(tags).trim()
        : (cur.tags || "");

      await queryTurso(
        env,
        `UPDATE productos 
         SET precio = ?,
             precio_oferta = ?,
             promo_tag = ?,
             disponible = ?,
             imagen_url = ?,
             nombre = ?,
             presentacion = ?,
             categoria = ?,
             emoji = ?,
             descripcion = ?,
             tags = ?,
             updated_at = datetime('now')
         WHERE id = ?;`,
        [
          nextPrecio,
          nextOferta,
          nextTag,
          nextDisp,
          nextImg,
          nextNombre,
          nextPres,
          nextCat,
          nextEmoji,
          nextDesc,
          nextTags,
          id
        ]
      );
    }

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

export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return jsonResponse({ success: false, error: "No autorizado. PIN requerido." }, 401);
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }
    if (!id) {
      return jsonResponse({ success: false, error: "El ID del producto es obligatorio" }, 400);
    }
    await queryTurso(env, "DELETE FROM productos WHERE id = ?;", [id]);
    return jsonResponse({
      success: true,
      deleted: id,
      message: `Producto ${id} eliminado de Turso`
    });
  } catch (err) {
    console.error("Error en DELETE /api/admin/products:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
