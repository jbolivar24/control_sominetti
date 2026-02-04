/* ==================================================
   API CONFIG
   ================================================== */

const API_ENDPOINT = "https://api.xaimua.com/api/backup";

/* ==================================================
   BUILD JSON PAYLOAD
   ================================================== */

function buildPayload() {
  return {
    usuario: getData("usuario"),
    ventas: getData("ventas") || [],
    compras: getData("compras") || [],
    productos: getData("productos") || [],
    sentAt: new Date().toISOString(),
    app: "gestion-comercial-web"
  };
}

/* ==================================================
   SEND DATA
   ================================================== */

async function sendBackupToServer() {
  const payload = buildPayload();

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Error enviando datos");
    }

    console.log("✅ JSON enviado correctamente");
    return true;

  } catch (err) {
    console.error("❌ Error enviando JSON:", err);
    alert("No se pudo enviar el respaldo al servidor");
    return false;
  }
}
