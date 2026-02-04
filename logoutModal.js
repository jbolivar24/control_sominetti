document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("modalLogout");
  if (!modal) return;

  // Cancelar
  document.getElementById("btnCancelLogout")
    ?.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

  // Confirmar cerrar sesión
  document.getElementById("btnConfirmLogout")
    ?.addEventListener("click", async (event) => {

      const btn = event.currentTarget;
      btn.disabled = true;

      modal.classList.add("hidden");

      try {
        if (typeof exportBackup === "function") {
          exportBackup();              // respaldo local
          await sendBackupToServer();  // envío remoto
        }
      } catch (e) {
        console.warn("⚠️ Error enviando respaldo:", e);
      }

      forceEndSession();               // SIEMPRE cerrar
    });
});
