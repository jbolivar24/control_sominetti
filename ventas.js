// ================= DATOS BASE =================
const productos = getData("productos") || [];
const usuario   = getData("usuario") || {};

// ================= ELEMENTOS =================
const form = document.getElementById("ventaForm");
const tablaVentas = document.getElementById("tablaVentas");
const tablaItems = document.getElementById("tablaItems");

const fecha = document.getElementById("fecha");
const factura = document.getElementById("factura");
const cliente = document.getElementById("cliente");

const productoSel = document.getElementById("producto");
const cantidadInput = document.getElementById("cantidad");
const precioInput = document.getElementById("precio");

const netoEl = document.getElementById("neto");
const ivaEl = document.getElementById("iva");
const totalEl = document.getElementById("total");

const ventaDesde = document.getElementById("ventaDesde");
const ventaHasta = document.getElementById("ventaHasta");
const btnFiltrarVentas = document.getElementById("btnFiltrarVentas");

// ================= ESTADO =================
let ventasFiltradas = null;
let items = [];
let editIndex = null;
let ventaOriginal = null;

setDynamicTitle("Ventas");

// ================= HELPERS =================
function revertirVendidos(items = []) {
  const productos = getData("productos") || [];

  items.forEach(it => {
    const p = productos.find(x => x.codigo === it.codigo);
    if (p) {
      p.vendidos = (p.vendidos || 0) - it.cantidad;
      if (p.vendidos < 0) p.vendidos = 0;
    }
  });

  saveData("productos", productos);
}

// ================= CARGA PRODUCTOS =================
productos.forEach(p => {
  const opt = document.createElement("option");
  opt.value = p.codigo;
  opt.textContent = `${p.codigo} - ${p.nombre}`;
  productoSel.appendChild(opt);
});

productoSel.onchange = () => {
  const p = productos.find(x => x.codigo === productoSel.value);
  if (p) precioInput.value = p.precioVenta;
};

// ================= ITEMS =================
document.getElementById("btnAgregarItem").onclick = () => {
  const p = productos.find(x => x.codigo === productoSel.value);
  const cantidad = Number(cantidadInput.value);
  const precio = Number(precioInput.value);

  if (!p || cantidad <= 0 || precio <= 0) return;

  items.push({
    codigo: p.codigo,
    nombre: p.nombre,
    cantidad,
    precio
  });

  cantidadInput.value = "";
  precioInput.value = "";
  renderItems();
};

function renderItems() {
  tablaItems.innerHTML = `
    <tr>
      <th>Producto</th>
      <th>Cant.</th>
      <th>Precio</th>
      <th>Subtotal</th>
      <th></th>
    </tr>
  `;

  let neto = 0;

  items.forEach((it, i) => {
    const sub = it.cantidad * it.precio;
    neto += sub;

    tablaItems.innerHTML += `
      <tr>
        <td>${it.codigo} - ${it.nombre}</td>
        <td>${it.cantidad}</td>
        <td class="right">${formatCLP(it.precio)}</td>
        <td class="right">${formatCLP(sub)}</td>
        <td>
          <button class="btn-eliminar" onclick="eliminarItem(${i})">🗑️</button>
        </td>
      </tr>
    `;
  });

  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  animateNumber(netoEl, neto, 650);
  animateNumber(ivaEl, iva, 650);
  animateNumber(totalEl, total, 650);
}

function eliminarItem(i) {
  items.splice(i, 1);
  renderItems();
}

// ================= GUARDAR VENTA =================
form.onsubmit = (e) => {
  e.preventDefault();
  if (items.length === 0) return alert("Agregue al menos un item");

  const ventas = getData("ventas");

  const neto = items.reduce((a, b) => a + b.cantidad * b.precio, 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  const venta = {
    f: fecha.value,
    fa: factura.value,
    c: cliente.value,
    items,
    neto,
    iva,
    t: total
  };

  if (editIndex !== null) {
    ventas[editIndex] = venta;
    editIndex = null;
    ventaOriginal = null;
  } else {
    ventas.push(venta);
  }

  saveData("ventas", ventas);

  // 🔥 recalcular TODO después de guardar
  recalcularProductos();

  form.reset();
  items = [];
  renderItems();
  renderVentas();
};

// ================= TABLA VENTAS =================
function renderVentas() {
  const allVentas = getData("ventas") || [];
  const ventas = ventasFiltradas || allVentas;

  tablaVentas.innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>Factura</th>
      <th>Cliente</th>
      <th class="right">Neto</th>
      <th class="right">IVA</th>
      <th class="right">Total</th>
      <th>Acciones</th>
    </tr>
  `;

  ventas.forEach(v => {
    const realIndex = allVentas.findIndex(x =>
      x.f === v.f &&
      x.fa === v.fa &&
      x.c === v.c &&
      x.t === v.t
    );

    tablaVentas.innerHTML += `
      <tr>
        <td>${v.f}</td>
        <td>${v.fa}</td>
        <td>${v.c}</td>
        <td class="monto right" data-valor="${v.neto}">$0</td>
        <td class="monto right" data-valor="${v.iva}">$0</td>
        <td class="monto right" data-valor="${v.t}">$0</td>
        <td>
          <button class="btn-editar" onclick="editar(${realIndex})">✏️</button>
          <button class="btn-eliminar" onclick="eliminar(${realIndex})">🗑️</button>
          <button class="btn-editar" onclick="verDetalle(${realIndex})">👁️</button>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll(".monto").forEach(td => {
    animateNumber(td, Number(td.dataset.valor), 400);
  });
}

// ================= EDITAR / ELIMINAR =================
function editar(i) {
  const v = getData("ventas")[i];

  // respaldo solo informativo (por si quieres cancelar)
  ventaOriginal = JSON.parse(JSON.stringify(v));

  fecha.value   = v.f;
  factura.value = v.fa;
  cliente.value = v.c;

  // clonar items correctamente
  items = v.items.map(it => ({ ...it }));

  editIndex = i;
  renderItems();
}

function eliminar(i) {
  if (!confirm("¿Eliminar esta venta?")) return;

  const ventas = getData("ventas");
  ventas.splice(i, 1);
  saveData("ventas", ventas);

  // 🔥 recalcular TODO el inventario
  recalcularProductos();

  renderVentas();
}

// ================= FILTRO =================
btnFiltrarVentas.onclick = () => {
  if (!ventaDesde.value || !ventaHasta.value) {
    ventasFiltradas = null;
    renderVentas();
    return;
  }

  ventasFiltradas = filterByDateRange(
    getData("ventas"),
    ventaDesde.value,
    ventaHasta.value
  );

  renderVentas();
};

// ================= DETALLE =================
function verDetalle(i) {
  const v = getData("ventas")[i];
  const body = document.getElementById("modalBody");

  let html = "";

  (v.items || []).forEach(it => {
    html += `
      <div class="modal-body-item">
        <div>
          <strong>${it.codigo ?? "-"}</strong> - ${it.nombre}<br>
          <small>
            ${it.cantidad} × ${formatCLP(it.precio)}
          </small>
        </div>
        <div class="right">
          ${formatCLP(it.cantidad * it.precio)}
        </div>
      </div>
    `;
  });

  html += `
    <div class="modal-total">
      <div class="modal-body-item">
        <span>Neto</span>
        <span>${formatCLP(v.neto)}</span>
      </div>
      <div class="modal-body-item">
        <span>IVA 19%</span>
        <span>${formatCLP(v.iva)}</span>
      </div>
      <div class="modal-body-item total">
        <strong>Total</strong>
        <strong>${formatCLP(v.t)}</strong>
      </div>
    </div>
  `;

  body.innerHTML = html;
  document.getElementById("modalDetalle").classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("modalDetalle").classList.add("hidden");
}

// ================= EXPORT =================
function exportVentasCSV() {
  const ventas = ventasFiltradas || getData("ventas");
  if (!ventas.length) return alert("No hay ventas para exportar.");

  const header = ["Fecha","Factura","Cliente","Neto","IVA","Total","Detalle"];

  const rows = ventas.map(v => [
    v.f || "",
    v.fa || "",
    v.c || "",
    v.neto || 0,
    v.iva || 0,
    v.t || 0,
    (v.items || []).map(it => `${it.codigo} (${it.cantidad})`).join("; ")
  ]);

  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  downloadText(`ventas_${fileStamp()}.csv`, csv, "text/csv;charset=utf-8");
}

function exportVentasPDF() {
  const ventas = ventasFiltradas || getData("ventas");
  if (!ventas.length) return alert("No hay ventas para exportar.");

  if (!usuario.razonSocial) {
    alert("Complete los datos del negocio antes de exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4");

  doc.setFontSize(14);
  doc.text(usuario.razonSocial, 40, 40);
  doc.setFontSize(12);
  doc.text("Reporte de Ventas", 40, 80);

  const body = ventas.map(v => [
    v.f,
    v.fa,
    v.c,
    formatCLP(v.neto),
    formatCLP(v.iva),
    formatCLP(v.t)
  ]);

  doc.autoTable({
    startY: 110,
    head: [["Fecha","Factura","Cliente","Neto","IVA","Total"]],
    body,
    styles: { fontSize: 9 }
  });

  doc.save(`ventas_${fileStamp()}.pdf`);
}

function recalcularProductos() {
  const productos = getData("productos") || [];
  const compras   = getData("compras") || [];
  const ventas    = getData("ventas") || [];

  // 🔄 resetear contadores
  productos.forEach(p => {
    p.comprados = 0;
    p.vendidos  = 0;
  });

  // 🔼 sumar compras
  compras.forEach(c => {
    (c.items || []).forEach(it => {
      const p = productos.find(x => x.codigo === it.codigo);
      if (p) {
        p.comprados += it.cantidad;
        p.precioCompra = it.precio;       // última compra manda
        p.ultimaCompra = c.f;
      }
    });
  });

  // 🔽 sumar ventas
  ventas.forEach(v => {
    (v.items || []).forEach(it => {
      const p = productos.find(x => x.codigo === it.codigo);
      if (p) {
        p.vendidos += it.cantidad;
      }
    });
  });

  saveData("productos", productos);
}

// quickLogout.js

renderVentas();
