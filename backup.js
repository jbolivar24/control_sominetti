function exportBackup() {
  const usuario = getData("usuario") || {};

  // 📌 RUT limpio para nombre de archivo (sin puntos ni guión)
  const rutRaw = usuario.rut || "SIN_RUT";
  const rutFile = String(rutRaw).replace(/[^0-9kK]/g, "");

  const data = {
    meta: {
      version: 2,           // ✅ v2: ya no existe "gastos", ahora usamos "compras"
      createdAt: Date.now()
    },
    usuario,
    ventas: getData("ventas") || [],
    compras: getData("compras") || [],
    productos: getData("productos") || []
  };

  const filename = `datos_${rutFile}_${fileStamp()}.json`;

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const r = new FileReader();

  r.onload = () => {
    try {
      const d = JSON.parse(r.result);

      // ✅ Estructura mínima
      if (!d.usuario || !Array.isArray(d.ventas)) {
        throw new Error("Estructura de respaldo inválida");
      }

      // =========================
      // v2 (nuevo): compras
      // =========================
      let compras = Array.isArray(d.compras) ? d.compras : null;

      // =========================
      // v1 (viejo): gastos -> intento de conversión a compras
      // (No hay manera de reconstruir items si no venían)
      // =========================
      if (!compras && Array.isArray(d.gastos)) {
        compras = d.gastos
          .filter(g => g && String(g.cat || "").toLowerCase() === "compras")
          .map(g => {
            const desc = String(g.desc || "");
            // "Compra 45266575 · GERMIX"
            let fa = "";
            let p  = "";
            const m = desc.match(/Compra\s+([^·]+)·\s*(.*)$/i);
            if (m) {
              fa = (m[1] || "").trim();
              p  = (m[2] || "").trim();
            }
            const total = Number(g.monto) || 0;
            const neto  = Math.round(total / 1.19);
            const iva   = total - neto;

            return {
              f: g.f || "",
              fa,
              p,
              items: [],   // ⚠️ no existían en v1
              neto,
              iva,
              t: total
            };
          });
      }

      if (!compras) compras = [];

      saveData("usuario", d.usuario);
      saveData("ventas", d.ventas || []);
      saveData("compras", compras);
      saveData("productos", d.productos || []);

      // ✅ marcar archivo como activo
      sessionStorage.setItem("activeFile", "true");
      if (typeof updateQuickLogout === "function") updateQuickLogout();

      // ✅ recalcular inventario por seguridad
      if (typeof recalcularProductos === "function") recalcularProductos();

      // ✅ renderizar UI (index)
      if (typeof renderBusinessHeader === "function") renderBusinessHeader();
      if (typeof renderResumen === "function") renderResumen();

      // ✅ dejar que el watcher decida
      if (typeof enforceAppState === "function") enforceAppState();

    } catch (err) {
      alert("❌ Archivo de respaldo inválido");
      console.error(err);
    }
  };

  r.readAsText(file);
}
