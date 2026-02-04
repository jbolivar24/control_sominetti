/* =========================
   COMPRAS
   ========================= */

setDynamicTitle("Compras");

// ================= ELEMENTOS =================
const form = document.getElementById("compraForm");
const tablaCompras = document.getElementById("tablaCompras");
const tablaItems   = document.getElementById("tablaItems");

const fecha     = document.getElementById("fecha");
const factura   = document.getElementById("factura");
const proveedor = document.getElementById("proveedor");

const productoSel   = document.getElementById("producto");
const cantidadInput = document.getElementById("cantidad");
const precioInput   = document.getElementById("precio");

const netoEl  = document.getElementById("neto");
const ivaEl   = document.getElementById("iva");
const totalEl = document.getElementById("total");

const desdeEl = document.getElementById("desde");
const hastaEl = document.getElementById("hasta");
const btnFiltrar = document.getElementById("btnFiltrar");

// ================= ESTADO =================
let items = [];
let editIndex = null;
let comprasFiltradas = null;

// ================= DATOS BASE =================
function getCompras() {
  return getData("compras") || [];
}

function saveCompras(arr) {
  saveData("compras", arr || []);
}

// ================= CARGA PRODUCTOS =================
function cargarProductosSelect() {
  const productos = getData("productos") || [];

  // reset
  productoSel.innerHTML = `<option value="">Seleccione producto</option>`;

  productos.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.codigo;
    opt.textContent = `${p.codigo} - ${p.nombre}`;
    productoSel.appendChild(opt);
  });
}

// ================= FORM =================
function resetForm() {
  fecha.value = "";
  factura.value = "";
  proveedor.value = "";
  items = [];
  editIndex = null;

  renderItems();
  calcularTotales();
}

// ================= ITEMS =================
document.getElementById("btnAgregarItem")
  ?.addEventListener("click", agregarItem);

function agregarItem() {
  const codigo = productoSel.value;
  const cant   = Number(cantidadInput.value);
  const precio = Number(precioInput.value);

  if (!codigo || cant <= 0 || precio <= 0) return;

  const productos = getData("productos") || [];
  const p = productos.find(x => x.codigo === codigo);
  if (!p) return;

  items.push({
    codigo: p.codigo,
    nombre: p.nombre,
    cantidad: cant,
    precio: precio
  });

  cantidadInput.value = "";
  precioInput.value = "";

  renderItems();
  calcularTotales();
}

function renderItems() {
  tablaItems.innerHTML = `
    <tr>
      <th>Código</th>
      <th>Producto</th>
      <th>Cantidad</th>
      <th>Precio</th>
      <th class="right">Total</th>
      <th></th>
    </tr>
  `;

  items.forEach((it, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.codigo}</td>
      <td>${it.nombre}</td>
      <td>${it.cantidad}</td>
      <td class="right">${formatCLP(it.precio)}</td>
      <td class="right">${formatCLP(it.cantidad * it.precio)}</td>
      <td>
        <button class="btn-eliminar" type="button" onclick="eliminarItem(${i})">🗑️</button>
      </td>
    `;
    tablaItems.appendChild(tr);
  });
}

function eliminarItem(i) {
  items.splice(i, 1);
  renderItems();
  calcularTotales();
}

window.eliminarItem = eliminarItem;

// ================= TOTALES =================
function calcularTotales() {
  const neto = items.reduce((a, b) => a + (Number(b.cantidad) * Number(b.precio)), 0);
  const iva  = Math.round(neto * 0.19);
  const total = neto + iva;

  netoEl.textContent  = formatCLP(neto);
  ivaEl.textContent   = formatCLP(iva);
  totalEl.textContent = formatCLP(total);

  return { neto, iva, total };
}

// ================= GUARDAR COMPRA =================
form?.addEventListener("submit", e => {
  e.preventDefault();

  if (!fecha.value || !factura.value || !proveedor.value || !items.length) {
    alert("Complete todos los datos de la compra.");
    return;
  }

  const { neto, iva, total } = calcularTotales();
  const compras = getCompras();

  const compra = {
    f: fecha.value,
    fa: factura.value,
    p: proveedor.value,

    // ✅ CLONAR ITEMS (importante para que queden en JSON y no se vacíen)
    items: items.map(it => ({ ...it })),

    neto,
    iva,
    t: total
  };

  if (editIndex !== null) {
    compras[editIndex] = compra;
  } else {
    compras.push(compra);
  }

  saveCompras(compras);

  // ✅ recalcular inventario (global)
  if (typeof recalcularProductos === "function") recalcularProductos();

  resetForm();
  comprasFiltradas = null;
  renderCompras();
});

// ================= LISTADO =================
function renderCompras() {
  const base = getCompras();
  const compras = comprasFiltradas || base;

  tablaCompras.innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>Documento</th>
      <th>Proveedor</th>
      <th class="right">Neto</th>
      <th class="right">IVA</th>
      <th class="right">Total</th>
      <th>Acciones</th>
    </tr>
  `;

  compras.forEach((c, i) => {
    const realIndex = comprasFiltradas ? base.indexOf(c) : i;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.f || ""}</td>
      <td>${c.fa || ""}</td>
      <td>${c.p || ""}</td>
      <td class="monto right" data-valor="${c.neto || 0}">$0</td>
      <td class="monto right" data-valor="${c.iva || 0}">$0</td>
      <td class="monto right" data-valor="${c.t || 0}">$0</td>
      <td>
        <button class="btn-editar" type="button" onclick="editarCompra(${realIndex})">✏️</button>
        <button class="btn-eliminar" type="button" onclick="eliminarCompra(${realIndex})">🗑️</button>
        <button class="btn-editar" type="button" onclick="verDetalleCompra(${realIndex})">👁️</button>
      </td>
    `;
    tablaCompras.appendChild(tr);
  });

  document.querySelectorAll(".monto").forEach(td => {
    animateNumber(td, Number(td.dataset.valor), 400);
  });
}

// ================= ACCIONES =================
function eliminarCompra(i) {
  if (!confirm("¿Eliminar esta compra?")) return;

  const compras = getCompras();
  compras.splice(i, 1);
  saveCompras(compras);

  if (typeof recalcularProductos === "function") recalcularProductos();

  comprasFiltradas = null;
  renderCompras();
}

function editarCompra(i) {
  const c = getCompras()[i];

  fecha.value = c.f || "";
  factura.value = c.fa || "";
  proveedor.value = c.p || "";

  items = (c.items || []).map(it => ({ ...it }));
  editIndex = i;

  renderItems();
  calcularTotales();
}

function verDetalleCompra(i) {
  const c = getCompras()[i] || {};
  const body = document.getElementById("modalBody");

  let html = "";

  (c.items || []).forEach(it => {
    html += `
      <div class="modal-body-item">
        <div>
          <strong>${it.codigo ?? "-"}</strong> - ${it.nombre}<br>
          <small>${it.cantidad} × ${formatCLP(it.precio)}</small>
        </div>
        <div class="right">
          ${formatCLP((Number(it.cantidad) || 0) * (Number(it.precio) || 0))}
        </div>
      </div>
    `;
  });

  html += `
    <div class="modal-total">
      <div class="modal-body-item">
        <span>Neto</span>
        <span>${formatCLP(c.neto || 0)}</span>
      </div>
      <div class="modal-body-item">
        <span>IVA 19%</span>
        <span>${formatCLP(c.iva || 0)}</span>
      </div>
      <div class="modal-body-item total">
        <strong>Total</strong>
        <strong>${formatCLP(c.t || 0)}</strong>
      </div>
    </div>
  `;

  if (body) body.innerHTML = html;
  document.getElementById("modalDetalle")?.classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("modalDetalle")?.classList.add("hidden");
}

window.eliminarCompra = eliminarCompra;
window.editarCompra = editarCompra;
window.verDetalleCompra = verDetalleCompra;
window.cerrarModal = cerrarModal;

// ================= FILTRO =================
btnFiltrar?.addEventListener("click", () => {
  const from = desdeEl?.value || "";
  const to   = hastaEl?.value || "";

  if (!from || !to) {
    comprasFiltradas = null;
    renderCompras();
    return;
  }

  comprasFiltradas = filterByDateRange(getCompras(), from, to);
  renderCompras();
});

// ================= EXPORT =================
function exportComprasCSV() {
  const compras = comprasFiltradas || getCompras();
  if (!compras.length) return alert("No hay compras para exportar.");

  const header = ["Fecha","Documento","Proveedor","Neto","IVA","Total","Detalle"];

  const rows = compras.map(c => [
    c.f || "",
    c.fa || "",
    c.p || "",
    c.neto || 0,
    c.iva || 0,
    c.t || 0,
    (c.items || []).map(it => `${it.codigo} (${it.cantidad})`).join("; ")
  ]);

  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  downloadText(`compras_${fileStamp()}.csv`, csv, "text/csv;charset=utf-8");
}

function exportComprasPDF() {
  const compras = comprasFiltradas || getCompras();
  if (!compras.length) return alert("No hay compras para exportar.");

  const usuario = getData("usuario") || {};
  const razon = usuario.razonSocial || "Reporte de compras";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4");

  doc.setFontSize(14);
  doc.text(razon, 40, 40);
  doc.setFontSize(12);
  doc.text("Reporte de Compras", 40, 60);

  const head = [["Fecha","Documento","Proveedor","Neto","IVA","Total","Detalle"]];
  const body = compras.map(c => [
    c.f || "",
    c.fa || "",
    c.p || "",
    formatCLP(c.neto || 0),
    formatCLP(c.iva || 0),
    formatCLP(c.t || 0),
    (c.items || []).map(it => `${it.codigo} (${it.cantidad})`).join(" · ")
  ]);

  doc.autoTable({
    head,
    body,
    startY: 80,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 110, 200] }
  });

  doc.save(`compras_${fileStamp()}.pdf`);
}

window.exportComprasCSV = exportComprasCSV;
window.exportComprasPDF = exportComprasPDF;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  cargarProductosSelect();
  renderItems();
  renderCompras();
});
