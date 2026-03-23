import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SparePart {
  name: string;
  code: string;
  price: number | null;
  stock: number;
  categoryName?: string;
  supplierNames?: string[];
}

interface Supplier {
  name: string;
  cuit: string | null;
  email: string | null;
  phone: string | null;
  province: string | null;
  city: string | null;
  company: string | null;
  categoryName?: string;
  sparePartCount: number;
}

async function fetchAsDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function addHeader(doc: jsPDF, logoDataUrl: string, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 80, 30);
  doc.rect(0, 0, pageWidth, 30, "F");

  const logoH = 14;
  const logoW = logoH * (320 / 72);
  doc.addImage(logoDataUrl, "PNG", 14, 8, logoW, logoH);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Soluciones para el campo", pageWidth - 14, 19, { align: "right" });

  doc.setTextColor(30, 80, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 45);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generado: ${dateStr}`, pageWidth - 20, 45, { align: "right" });
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, footerY, { align: "center" });
  }
}

export async function exportSparePartsPDF(parts: SparePart[]) {
  const logoDataUrl = await fetchAsDataURL("/brand/greenpac_logo_horizontal.png");
  const doc = new jsPDF();

  addHeader(doc, logoDataUrl, "Inventario de Repuestos");

  const totalStock = parts.reduce((s, p) => s + p.stock, 0);
  const totalValue = parts.reduce((s, p) => s + (p.price ?? 0) * p.stock, 0);

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${parts.length} repuestos  |  Stock total: ${totalStock.toLocaleString("es-AR")}  |  Valor inventario: $${totalValue.toLocaleString("es-AR")}`, 20, 55);

  autoTable(doc, {
    startY: 62,
    head: [["Nombre", "Código", "Categoría", "Precio", "Stock", "Proveedor(es)"]],
    body: parts.map((p) => [
      p.name,
      p.code,
      p.categoryName || "—",
      p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "—",
      String(p.stock),
      p.supplierNames?.length ? p.supplierNames.join(", ") : "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      3: { halign: "right" },
      4: { halign: "center" },
    },
  });

  addFooter(doc);
  doc.save(`repuestos-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportSuppliersPDF(suppliers: Supplier[]) {
  const logoDataUrl = await fetchAsDataURL("/brand/greenpac_logo_horizontal.png");
  const doc = new jsPDF({ orientation: "landscape" });

  addHeader(doc, logoDataUrl, "Base de Proveedores");

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${suppliers.length} proveedores`, 20, 55);

  autoTable(doc, {
    startY: 62,
    head: [["Nombre", "Empresa", "CUIT", "Email", "Teléfono", "Provincia", "Ciudad", "Categoría", "Repuestos"]],
    body: suppliers.map((s) => [
      s.name,
      s.company || "—",
      s.cuit || "—",
      s.email || "—",
      s.phone || "—",
      s.province || "—",
      s.city || "—",
      s.categoryName || "—",
      s.sparePartCount > 0 ? `${s.sparePartCount}` : "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save(`proveedores-${new Date().toISOString().slice(0, 10)}.pdf`);
}
