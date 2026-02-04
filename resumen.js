/* =========================
   HEADER
   ========================= */
let chartVendidos   = null;
let chartComprados  = null;
let chartStock      = null;

setDynamicTitle("Home");

function renderBusinessHeader() {
  const user = getData("usuario");
  if (!user) return;

  document.getElementById("bhName").textContent =
    user.razonSocial || "";

  document.getElementById("bhGiro").textContent =
    user.giro || "";

  document.getElementById("bhAddress").textContent =
    user.direccion || "";
}

/* =========================
   RESUMEN
   ========================= */

function renderResumen() {
  // 🔒 No renderizar si no hay archivo activo
  if (sessionStorage.getItem("activeFile") !== "true") return;

  const ventas = getData("ventas") || [];
  const compras = getData("compras") || [];

  const totalVentas = ventas.reduce((a, b) => a + (b.t || 0), 0);
  const totalCompras = compras.reduce((a, b) => a + (b.t || 0), 0);
  const resultado   = totalVentas - totalCompras;

  const cont = document.getElementById("resumen");
  if (!cont) return;

  cont.innerHTML = `
    <div class="resumen-item">
      <span>Ventas</span>
      <strong id="vVentas">$0</strong>
    </div>

    <div class="resumen-item">
      <span>Compras</span>
      <strong id="vGastos">$0</strong>
    </div>

    <div class="divisor"></div>

    <div class="resumen-item resultado ${resultado >= 0 ? "positivo" : "negativo"}">
      <span>Resultado</span>
      <strong id="vResultado">$0</strong>
    </div>
  `;

  requestAnimationFrame(() => {
    animateNumber(document.getElementById("vVentas"), totalVentas, 1200);
    animateNumber(document.getElementById("vGastos"), totalCompras, 1200);
    animateNumber(document.getElementById("vResultado"), resultado, 1500);
  });

  renderResumenProductos();
  renderGraficosProductos();
}

function renderResumenProductos() {
  if (sessionStorage.getItem("activeFile") !== "true") return;

  const productos = getData("productos") || [];
  const compras   = getData("compras")   || [];
  const ventas    = getData("ventas")    || [];

  const cont = document.getElementById("resumenProductos");
  if (!cont) return;

  cont.innerHTML = "";

  productos.forEach(p => {

    const comprados = p.comprados || 0;
    const vendidos  = p.vendidos  || 0;
    const stock     = comprados - vendidos;

    // ===============================
    // DETALLE COMPRAS DEL PRODUCTO
    // ===============================
    const comprasProd = [];

    compras.forEach(c => {
      (c.items || []).forEach(it => {
        if (it.codigo === p.codigo) {
          comprasProd.push({
            fecha: c.f,
            cantidad: it.cantidad,
            precio: it.precio
          });
        }
      });
    });

    comprasProd.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // ===============================
    // DETALLE VENTAS DEL PRODUCTO
    // ===============================
    const ventasProd = [];

    ventas.forEach(v => {
      (v.items || []).forEach(it => {
        if (it.codigo === p.codigo) {
          ventasProd.push({
            fecha: v.f,
            cantidad: it.cantidad,
            precio: it.precio
          });
        }
      });
    });

    ventasProd.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // ===============================
    // RENDER
    // ===============================
    cont.innerHTML += `
      <div class="producto-resumen">

        <!-- HEADER CORREGIDO -->
        <div class="producto-header">

          <div class="ph-item">
            <span class="ph-label">Código</span>
            <span class="ph-value">${p.codigo}</span>
          </div>

          <div class="ph-item">
            <span class="ph-label">Producto</span>
            <span class="ph-value">${p.nombre}</span>
          </div>

          <div class="ph-item">
            <span class="ph-label">Comprados</span>
            <span class="ph-value">${comprados}</span>
          </div>

          <div class="ph-item">
            <span class="ph-label">Vendidos</span>
            <span class="ph-value">${vendidos}</span>
          </div>

          <div class="ph-item ${stock < 0 ? "negativo" : ""}">
            <span class="ph-label">Stock</span>
            <span class="ph-value">${stock}</span>
          </div>

        </div>

        <div class="producto-detalle">

          <div class="detalle-col">
            <h4>📦 Compras</h4>
            <div class="detalle-scroll">
              ${
                comprasProd.length
                  ? comprasProd.map(c => `
                    <div class="detalle-item">
                      <span>${c.fecha}</span>
                      <span>${c.cantidad} × ${formatCLP(c.precio)}</span>
                    </div>
                  `).join("")
                  : `<div class="detalle-vacio">Sin compras</div>`
              }
            </div>
          </div>

          <div class="detalle-col">
            <h4>🧾 Ventas</h4>
            <div class="detalle-scroll">
              ${
                ventasProd.length
                  ? ventasProd.map(v => `
                    <div class="detalle-item">
                      <span>${v.fecha}</span>
                      <span>${v.cantidad} × ${formatCLP(v.precio)}</span>
                    </div>
                  `).join("")
                  : `<div class="detalle-vacio">Sin ventas</div>`
              }
            </div>
          </div>

        </div>
      </div>
    `;
  });
}

function buildProductoChart(canvasId, label, values) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: label,
      datasets: [{
        data: values,
        backgroundColor: generarColores(label.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",

      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 14,
            padding: 12
          }
        }
      }
    }
  });
}

function generarColores(n) {
  const base = [
    "#4fc3f7", "#81c784", "#ffb74d",
    "#e57373", "#9575cd", "#4db6ac",
    "#f06292", "#aed581", "#7986cb"
  ];

  return Array.from({ length: n }, (_, i) =>
    base[i % base.length]
  );
}

function renderGraficosProductos() {
  if (sessionStorage.getItem("activeFile") !== "true") return;

  const productos = getData("productos") || [];
  if (!productos.length) return;

  const labels = productos.map(p => p.nombre);

  const vendidos   = productos.map(p => p.vendidos  || 0);
  const comprados  = productos.map(p => p.comprados || 0);
  const stock      = productos.map(p =>
    (p.comprados || 0) - (p.vendidos || 0)
  );

  // destruir si ya existen
  chartVendidos?.destroy();
  chartComprados?.destroy();
  chartStock?.destroy();

  chartVendidos = buildProductoChart(
    "graficoVendidos",
    labels,
    vendidos
  );

  chartComprados = buildProductoChart(
    "graficoComprados",
    labels,
    comprados
  );

  chartStock = buildProductoChart(
    "graficoStock",
    labels,
    stock
  );
}

/* =========================
   INIT APP
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     BOTONES DE SESIÓN
     ========================= */
  document.getElementById("btnExtendSession")
    ?.addEventListener("click", extendSession);

  document.getElementById("btnEndSession")
    ?.addEventListener("click", safeLogout);

  /* =========================
     BIENVENIDA
     ========================= */
  document.getElementById("btnNuevoUsuario")
    ?.addEventListener("click", () => {
      document.getElementById("modalNuevoUsuario")
        ?.classList.remove("hidden");
    });

  document.getElementById("btnCancelar")
    ?.addEventListener("click", () => {
      document.getElementById("modalNuevoUsuario")
        ?.classList.add("hidden");
    });

  document.getElementById("btnCargarDatos")
    ?.addEventListener("click", () => {
      document.getElementById("fileInputWelcome")?.click();
    });

    /* =========================
   CARGAR RESPALDO (BIENVENIDA)
   ========================= */
  document.getElementById("fileInputWelcome")
    ?.addEventListener("change", e => {

      if (!e.target.files || !e.target.files.length) return;

      importBackup(e);   // backup.js
    });

  /* =========================
     CREAR USUARIO
     ========================= */
  document.getElementById("nuevoUsuarioForm")
    ?.addEventListener("submit", e => {
      e.preventDefault();

      const user = {
        razonSocial: razonSocial.value.trim(),
        rut: rut.value.trim(),
        direccion: direccion.value.trim(),
        giro: giro.value.trim(),
        createdAt: Date.now()
      };

      saveData("usuario", user);
      saveData("ventas", []);
      saveData("compras", []);
      saveData("productos", []);

      // 🔑 archivo activo + sesión válida
      sessionStorage.setItem("activeFile", "true");
      updateQuickLogout();

      document.getElementById("modalNuevoUsuario")
        ?.classList.add("hidden");

      renderBusinessHeader();
      renderResumen();
      //startSessionTimer();

      enforceAppState();
    });

  /* =========================
   CERRAR SESIÓN (CON RESPALDO)
   ========================= */

  document.getElementById("btnLogout")
    ?.addEventListener("click", () => {
      document.getElementById("modalLogout")
        ?.classList.remove("hidden");
    });

  /* =========================
     ARRANQUE ÚNICO
     ========================= */
  enforceAppState();

  // Si el archivo está activo al arrancar, renderizamos
  if (sessionStorage.getItem("activeFile") === "true") {
    renderBusinessHeader();
    renderResumen();
    renderResumenProductos();
  }

  // ⬅️ UNA sola llamada, siempre al final
  updateQuickLogout();
});
