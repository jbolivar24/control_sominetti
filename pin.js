// ================== PIN CONFIG ==================
const PIN_KEY = "personal_pin_hash";
const UNLOCK_KEY = "personal_unlocked";

const pinModal   = document.getElementById("pinModal");
const pinInput   = document.getElementById("pinInput");
const pinTitle   = document.getElementById("pinTitle");
const pinConfirm = document.getElementById("pinConfirm");
const changePinBtn = document.getElementById("changePin");

// ================== HASH ==================
async function hashPin(pin) {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ================== UI ==================
function showPinModal(title) {
  pinTitle.textContent = title;
  pinInput.value = "";
  pinModal.classList.remove("hidden");
  pinInput.focus();
}

function unlockApp() {
  pinModal.classList.add("hidden");
  localStorage.setItem(UNLOCK_KEY, "1");

  // 🔑 puente con app.js
  if (typeof window.startApp === "function") {
    window.startApp();
  }
}

// ================== FLOW ==================
async function initPin() {
  const storedHash = localStorage.getItem(PIN_KEY);

  // Crear PIN
  if (!storedHash) {
    showPinModal("Crea tu PIN personal");

    pinConfirm.onclick = async () => {
      const pin = pinInput.value.trim();
      if (!/^\d{4}$/.test(pin)) {
        alert("El PIN debe tener 4 dígitos");
        return;
      }

      const hash = await hashPin(pin);
      localStorage.setItem(PIN_KEY, hash);
      unlockApp();
    };

    return;
  }

  // Pedir PIN
  showPinModal("Ingresa tu PIN");

  pinConfirm.onclick = async () => {
    const pin = pinInput.value.trim();
    const hash = await hashPin(pin);

    if (hash === storedHash) {
      unlockApp();
    } else {
      alert("PIN incorrecto");
      pinInput.value = "";
      pinInput.focus();
    }
  };
}

// ================== INIT ==================
if (!localStorage.getItem(UNLOCK_KEY)) {
  initPin();
}

// ================== CHANGE PIN ==================
if (changePinBtn) {
  changePinBtn.onclick = () => {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(UNLOCK_KEY);
    location.reload();
  };
}
