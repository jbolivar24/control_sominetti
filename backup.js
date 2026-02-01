function exportBackup() {
  const usuario = getData("usuario") || {};

  // 📌 RUT limpio para nombre de archivo (sin puntos ni guión)
  const rutRaw = usuario.rut || "SIN_RUT";
  const rutFile = rutRaw.replace(/[^0-9kK]/g, "");

  const data = {
    meta: {
      version: 1,
      createdAt: Date.now()
    },
    usuario,
    ventas: getData("ventas"),
    gastos: getData("gastos"),
    productos: getData("productos")
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

      if (!d.usuario || !Array.isArray(d.ventas) || !Array.isArray(d.gastos)) {
        throw new Error("Estructura de respaldo inválida");
      }

      saveData("usuario", d.usuario);
      saveData("ventas", d.ventas);
      saveData("gastos", d.gastos);
      saveData("productos", d.productos || []);

      // ✅ marcar archivo como activo
      sessionStorage.setItem("activeFile", "true");

      // ✅ iniciar sesión
      //startSessionTimer();

      // ✅ renderizar UI
      renderBusinessHeader();
      renderResumen();

      // ✅ dejar que el watcher decida
      enforceAppState();

    } catch (err) {
      alert("❌ Archivo de respaldo inválido");
      console.error(err);
    }
  };

  r.readAsText(file);
}
