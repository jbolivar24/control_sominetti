document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnQuickLogout");
  const modal = document.getElementById("modalLogout");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
});
