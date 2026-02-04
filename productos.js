// ================= ELEMENTOS =================
const form  = document.getElementById("productoForm");
const tabla = document.getElementById("tablaProductos");

const codigoInput       = document.getElementById("codigo");
const nombreInput       = document.getElementById("nombre");
const precioVentaInput  = document.getElementById("precioVenta");

// ================= DATOS =================
const usuario = getData("usuario") || {};
let editIndex = null;

setDynamicTitle("Productos");

// Inicialización segura
if (!localStorage.getItem("productos")) {
  saveData("productos", []);
}

// ================= RENDER =================
function render() {
  const productos = getData("productos");

  tabla.innerHTML = `
    <tr>
      <th>Código</th>
      <th>Producto</th>
      <th class="right">Precio Compra</th>
      <th class="right">Precio Venta</th>
      <th class="right">Comprados</th>
      <th class="right">Vendidos</th>
      <th class="right">Stock</th>
      <th>Acciones</th>
    </tr>
  `;

  productos.forEach((p, i) => {
    const compra    = p.precioCompra || 0;
    const venta     = p.precioVenta  || p.precio || 0; // compatibilidad
    const comprados = p.comprados || 0;
    const vendidos  = p.vendidos  || 0;
    const stock     = comprados - vendidos;

    tabla.innerHTML += `
      <tr>
        <td>${p.codigo || ""}</td>
        <td>${p.nombre}</td>

        <td class="right monto" data-valor="${compra}">$0</td>
        <td class="right monto" data-valor="${venta}">$0</td>

        <td class="right">${comprados}</td>
        <td class="right">${vendidos}</td>
        <td class="right ${stock < 0 ? "negativo" : ""}">${stock}</td>

        <td>
          <button class="btn-editar" onclick="editar(${i})">✏️</button>
          <button class="btn-eliminar" onclick="eliminar(${i})">🗑️</button>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll(".monto").forEach(td => {
    animateNumber(td, Number(td.dataset.valor), 400);
  });
}

// ================= GUARDAR =================
form.onsubmit = (e) => {
  e.preventDefault();

  const codigo      = codigoInput.value.trim();
  const nombre      = nombreInput.value.trim();
  const precioVenta = Number(precioVentaInput.value);

  if (!codigo || !nombre || precioVenta <= 0) return;

  const productos = getData("productos");

  // validar código único
  const duplicado = productos.some(
    (p, idx) => p.codigo === codigo && idx !== editIndex
  );
  if (duplicado) {
    alert("❌ Ya existe un producto con ese código");
    return;
  }

  const producto = {
    id: Date.now(),
    codigo,
    nombre,
    precioCompra: 0,   // 🔒 SIEMPRE 0 (solo compras lo cambia)
    precioVenta,
    comprados: 0,
    vendidos: 0
  };

  if (editIndex !== null) {
    producto.id        = productos[editIndex].id;
    producto.comprados = productos[editIndex].comprados || 0;
    producto.vendidos  = productos[editIndex].vendidos  || 0;

    productos[editIndex] = producto;
    editIndex = null;
  } else {
    productos.push(producto);
  }

  saveData("productos", productos);
  form.reset();
  render();
};


// ================= ACCIONES =================
function editar(i) {
  const p = getData("productos")[i];

  codigoInput.value      = p.codigo || "";
  nombreInput.value      = p.nombre;
  precioVentaInput.value = p.precioVenta || p.precio || 0;

  editIndex = i;
}

function eliminar(i) {
  if (!confirm("¿Eliminar este producto?")) return;

  const productos = getData("productos");
  productos.splice(i, 1);

  recalcularProductos();
  saveData("productos", productos);
  render();
}

// ================= EXPORT CSV =================
function exportProductosCSV() {
  const productos = getData("productos");
  if (!productos.length) return alert("No hay productos para exportar.");

  const header = [
    "Código",
    "Producto",
    "Precio compra",
    "Precio venta",
    "Comprados",
    "Vendidos",
    "Stock"
  ];

  const rows = productos.map(p => {
    const comprados = p.comprados || 0;
    const vendidos  = p.vendidos  || 0;

    return [
      p.codigo || "",
      p.nombre || "",
      p.precioCompra || 0,
      p.precioVenta || p.precio || 0,
      comprados,
      vendidos,
      comprados - vendidos
    ];
  });

  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  downloadText(
    `productos_${fileStamp()}.csv`,
    csv,
    "text/csv;charset=utf-8"
  );
}

// ================= EXPORT PDF =================
function exportProductosPDF() {
  const productos = getData("productos");
  if (!productos.length) {
    alert("No hay productos para exportar.");
    return;
  }

  if (!usuario.razonSocial) {
    alert("Complete los datos del negocio antes de exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;

  // 📐 MISMO FORMATO QUE VENTAS Y COMPRAS
  const doc = new jsPDF("l", "pt", "a4");

  // =========================
  // ENCABEZADO
  // =========================
  doc.setFontSize(14);
  doc.text(usuario.razonSocial, 40, 40);

  // =========================
  // TÍTULO
  // =========================
  doc.setFontSize(12);
  doc.text("Reporte de Productos", 40, 80);

  // =========================
  // TABLA
  // =========================
  const body = productos.map(p => {
    const comprados = p.comprados || 0;
    const vendidos  = p.vendidos  || 0;

    return [
      p.codigo || "",
      p.nombre,
      formatCLP(p.precioCompra || 0),
      formatCLP(p.precioVenta || p.precio || 0),
      comprados,
      vendidos,
      comprados - vendidos
    ];
  });

  doc.autoTable({
    startY: 110,
    head: [[
      "Código",
      "Producto",
      "Precio Compra",
      "Precio Venta",
      "Comprados",
      "Vendidos",
      "Stock"
    ]],
    body,
    styles: { fontSize: 9 }
  });

  doc.save(`productos_${fileStamp()}.pdf`);
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

// ================= INIT =================
render();
