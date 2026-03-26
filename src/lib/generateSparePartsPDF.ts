import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SparePart {
  name: string;
  code: string;
  price: number | null;
  stock: number;
  categoryName?: string;
  categoryColor?: string;
  supplierNames?: string[];
  imageUrl?: string | null;
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

async function loadImageAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function addHeader(doc: jsPDF, logoDataUrl: string, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark green header bar
  doc.setFillColor(30, 80, 30);
  doc.rect(0, 0, pageWidth, 32, "F");

  // Logo — larger
  const logoH = 20;
  const logoW = logoH * (320 / 72);
  doc.addImage(logoDataUrl, "PNG", 14, 6, logoW, logoH);

  // Slogan right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Soluciones para el campo", pageWidth - 14, 20, { align: "right" });

  // Green separator line
  doc.setDrawColor(22, 163, 74); // #16a34a
  doc.setLineWidth(0.8);
  doc.line(14, 34, pageWidth - 14, 34);

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 46);

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(subtitle, 14, 53);
  }

  // Date right
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generado: ${dateStr}`, pageWidth - 14, 46, { align: "right" });
}

function addFooter(doc: jsPDF, footerLabel: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = doc.internal.pageSize.getHeight() - 10;

    // Line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.setFont("helvetica", "normal");
    doc.text(footerLabel, 14, footerY);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, footerY, { align: "right" });
  }
}

function drawMetricBoxes(doc: jsPDF, parts: SparePart[], startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 6;
  const boxCount = 4;
  const boxW = (pageWidth - margin * 2 - gap * (boxCount - 1)) / boxCount;
  const boxH = 28;

  const totalParts = parts.length;
  const totalStock = parts.reduce((s, p) => s + p.stock, 0);
  const totalValue = parts.reduce((s, p) => s + (p.price ?? 0) * p.stock, 0);
  const lowStock = parts.filter((p) => p.stock > 0 && p.stock <= 5).length;

  const metrics = [
    { label: "Total repuestos", value: String(totalParts), alert: false },
    { label: "Stock total", value: totalStock.toLocaleString("es-AR"), alert: false },
    { label: "Valor inventario", value: `$${totalValue.toLocaleString("es-AR")}`, alert: false },
    { label: "Stock bajo (≤5)", value: String(lowStock), alert: lowStock > 0 },
  ];

  metrics.forEach((m, i) => {
    const x = margin + i * (boxW + gap);
    const y = startY;

    // Background
    if (m.alert) {
      doc.setFillColor(254, 242, 242); // #fef2f2
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD");

    // Value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(m.alert ? 220 : 30, m.alert ? 38 : 30, m.alert ? 38 : 30);
    doc.text(m.value, x + boxW / 2, y + 14, { align: "center" });

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(m.label, x + boxW / 2, y + 22, { align: "center" });
  });

  return startY + boxH + 8;
}

export async function exportSparePartsPDF(
  parts: SparePart[],
  categoryLabel?: string
) {
  const logoDataUrl = await fetchAsDataURL("/brand/greenpac_logo_horizontal.png");

  // Pre-load images for parts that have them
  const imageCache: Record<number, string> = {};
  const imagePromises = parts.map(async (p, idx) => {
    if (p.imageUrl) {
      const dataUrl = await loadImageAsDataURL(p.imageUrl);
      if (dataUrl) imageCache[idx] = dataUrl;
    }
  });
  await Promise.all(imagePromises);

  const doc = new jsPDF();

  const title = categoryLabel
    ? `Inventario de Repuestos — ${categoryLabel}`
    : "Inventario de Repuestos";

  addHeader(doc, logoDataUrl, title);

  // Metrics
  const tableStartY = drawMetricBoxes(doc, parts, 56);

  // Table
  autoTable(doc, {
    startY: tableStartY,
    head: [["", "Nombre", "Código", "Categoría", "Precio", "Stock", "Proveedor(es)"]],
    body: parts.map((p, idx) => [
      "", // photo cell handled in didDrawCell
      p.name,
      p.code,
      p.categoryName || "—",
      p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "—",
      String(p.stock),
      p.supplierNames?.length ? p.supplierNames.join(", ") : "—",
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [22, 163, 74], // #16a34a
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 4,
    },
    styles: {
      fontSize: 8,
      cellPadding: { top: 6, right: 3, bottom: 6, left: 3 },
      valign: "middle",
      lineWidth: 0.2,
      lineColor: [229, 231, 235],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // #f9fafb
    },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 16 },  // photo
      1: { cellWidth: 35 },
      2: { cellWidth: 22 },
      3: { cellWidth: 25 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "center", cellWidth: 16 },
    },
    didDrawCell: (data: any) => {
      // Draw photo in first column body cells
      if (data.column.index === 0 && data.section === "body") {
        const idx = data.row.index;
        const cellX = data.cell.x + 1;
        const cellY = data.cell.y + 2;
        const imgSize = Math.min(data.cell.height - 4, 12);

        if (imageCache[idx]) {
          try {
            doc.addImage(imageCache[idx], "JPEG", cellX, cellY, imgSize, imgSize);
          } catch {
            // fallback grey box
            doc.setFillColor(229, 231, 235);
            doc.roundedRect(cellX, cellY, imgSize, imgSize, 1, 1, "F");
          }
        } else {
          doc.setFillColor(229, 231, 235);
          doc.roundedRect(cellX, cellY, imgSize, imgSize, 1, 1, "F");
          // small icon placeholder
          doc.setFontSize(6);
          doc.setTextColor(156, 163, 175);
          doc.text("img", cellX + imgSize / 2, cellY + imgSize / 2 + 1.5, { align: "center" });
        }
      }

      // Draw category badge
      if (data.column.index === 3 && data.section === "body") {
        const idx = data.row.index;
        const part = parts[idx];
        if (part?.categoryColor && part?.categoryName) {
          const text = part.categoryName;
          const cellX = data.cell.x;
          const cellY = data.cell.y;
          const cellH = data.cell.height;
          
          doc.setFontSize(7);
          const textW = doc.getTextWidth(text);
          const badgeW = textW + 6;
          const badgeH = 8;
          const bx = cellX + 3;
          const by = cellY + (cellH - badgeH) / 2;

          const [r, g, b] = hexToRgb(part.categoryColor);
          // Light background
          doc.setFillColor(
            Math.min(r + 180, 255),
            Math.min(g + 180, 255),
            Math.min(b + 180, 255)
          );
          doc.roundedRect(bx, by, badgeW, badgeH, 2, 2, "F");
          
          doc.setTextColor(r, g, b);
          doc.setFont("helvetica", "bold");
          doc.text(text, bx + 3, by + 5.5);
          doc.setFont("helvetica", "normal");

          // Clear original text by drawing over it - we already drew the badge
          // The text was already drawn by autoTable, so we overlay
        }
      }
    },
  });

  addFooter(doc, "Greenpac — Inventario de Repuestos");

  const suffix = categoryLabel ? `-${categoryLabel.toLowerCase().replace(/\s+/g, "-")}` : "";
  doc.save(`repuestos${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportSuppliersPDF(suppliers: Supplier[]) {
  const logoDataUrl = await fetchAsDataURL("/brand/greenpac_logo_horizontal.png");
  const doc = new jsPDF({ orientation: "landscape" });

  addHeader(doc, logoDataUrl, "Base de Proveedores");

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${suppliers.length} proveedores`, 14, 55);

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
    theme: "plain",
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 4,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineWidth: 0.2,
      lineColor: [229, 231, 235],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc, "Greenpac — Base de Proveedores");
  doc.save(`proveedores-${new Date().toISOString().slice(0, 10)}.pdf`);
}
