/* ==================================================
   SEND DATA (SILENT / BEST-EFFORT)
   ================================================== */

async function sendBackupToServer() {
  const payload = buildPayload();

  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true   // 👈 importante para cierre de sesión / unload
    });

    // ❗ NO logs, NO alerts, NO returns visibles

  } catch (_) {
    // ❗ Silencio absoluto
    // No hacemos nada a propósito
  }
}
