import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SparePart {
  name: string;
  code: string;
  price: number | null;
  stock: number;
  minStock?: number | null;
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
    // Skip SVGs — they don't render well in jsPDF
    if (blob.type === "image/svg+xml") return null;
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

function generatePlaceholder(name: string): string {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, 96, 96);
  ctx.font = "bold 32px sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, 48, 48);
  return canvas.toDataURL("image/png");
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function addHeader(doc: jsPDF, logoDataUrl: string, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark green header bar
  doc.setFillColor(30, 80, 30);
  doc.rect(0, 0, pageWidth, 32, "F");

  // Logo
  const logoH = 20;
  const logoW = logoH * (320 / 72);
  doc.addImage(logoDataUrl, "PNG", 14, 6, logoW, logoH);

  // Slogan right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Soluciones para el campo", pageWidth - 14, 20, { align: "right" });

  // Green separator line
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.8);
  doc.line(14, 34, pageWidth - 14, 34);

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 46);

  // Date right
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text("Generado: " + dateStr, pageWidth - 14, 46, { align: "right" });
}

function addFooter(doc: jsPDF, footerLabel: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = doc.internal.pageSize.getHeight() - 10;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.setFont("helvetica", "normal");
    doc.text(footerLabel, 14, footerY);
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 14, footerY, { align: "right" });
  }
}

function drawMetricBoxes(doc: jsPDF, parts: SparePart[], startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 6;
  const boxCount = 4;
  const boxW = (pageWidth - margin * 2 - gap * (boxCount - 1)) / boxCount;
  const boxH = 30;

  const totalParts = parts.length;
  const totalStock = parts.reduce((s, p) => s + p.stock, 0);
  const totalValue = parts.reduce((s, p) => s + (p.price ?? 0) * p.stock, 0);
  const lowStock = parts.filter((p) => p.minStock != null && p.stock <= p.minStock).length;

  const metrics = [
    { label: "Total repuestos", value: String(totalParts), alert: false },
    { label: "Stock total", value: totalStock.toLocaleString("es-AR"), alert: false },
    { label: "Valor inventario", value: "$" + totalValue.toLocaleString("es-AR"), alert: false },
    { label: "Stock bajo", value: String(lowStock), alert: lowStock > 0 },
  ];

  metrics.forEach((m, i) => {
    const x = margin + i * (boxW + gap);
    const y = startY;

    // Background fill
    if (m.alert) {
      doc.setFillColor(254, 242, 242); // #fef2f2
    } else {
      doc.setFillColor(255, 255, 255);
    }

    // Border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD");

    // Left accent border
    if (m.alert) {
      doc.setFillColor(220, 38, 38); // #dc2626 red
    } else {
      doc.setFillColor(22, 163, 74); // #16a34a green
    }
    doc.rect(x, y + 1, 1.4, boxH - 2, "F");

    // Value — centered
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    if (m.alert) {
      doc.setTextColor(220, 38, 38); // #dc2626
    } else {
      doc.setTextColor(30, 30, 30);
    }
    doc.text(m.value, x + boxW / 2, y + 14, { align: "center" });

    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(m.label, x + boxW / 2, y + 23, { align: "center" });
  });

  return startY + boxH + 8;
}

export async function exportSparePartsPDF(
  parts: SparePart[],
  categoryLabel?: string
) {
  const logoDataUrl = await fetchAsDataURL("/brand/greenpac_logo_horizontal.png");

  // Pre-load all images as base64
  const imageCache: Record<number, string> = {};
  const placeholderCache: Record<number, string> = {};

  const imagePromises = parts.map(async (p, idx) => {
    if (p.imageUrl) {
      const dataUrl = await loadImageAsDataURL(p.imageUrl);
      if (dataUrl) {
        imageCache[idx] = dataUrl;
      } else {
        placeholderCache[idx] = generatePlaceholder(p.name);
      }
    } else {
      placeholderCache[idx] = generatePlaceholder(p.name);
    }
  });
  await Promise.all(imagePromises);

  const doc = new jsPDF();
  const isFiltered = !!categoryLabel;

  const title = isFiltered
    ? "Inventario de Repuestos - " + categoryLabel
    : "Inventario de Repuestos";

  addHeader(doc, logoDataUrl, title);

  const tableStartY = drawMetricBoxes(doc, parts, 56);

  // Build columns conditionally — hide Categoria when filtered
  const headRow = isFiltered
    ? ["", "Nombre", "Codigo", "Precio", "Stock", "Proveedor(es)"]
    : ["", "Nombre", "Codigo", "Categoria", "Precio", "Stock", "Proveedor(es)"];

  const bodyRows = parts.map((p) => {
    const base = [
      "", // photo placeholder
      p.name,
      p.code,
    ];
    if (!isFiltered) {
      base.push(""); // category — drawn as badge via didDrawCell
    }
    base.push(
      p.price != null ? "$" + Number(p.price).toLocaleString("es-AR") : "-",
      String(p.stock),
      p.supplierNames?.length ? p.supplierNames.join(", ") : "-"
    );
    return base;
  });

  // Column index mapping
  const catColIdx = isFiltered ? -1 : 3;
  const priceColIdx = isFiltered ? 3 : 4;
  const stockColIdx = isFiltered ? 4 : 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usable = pageWidth - 28; // margins

  const colStyles: Record<number, any> = {
    0: { cellWidth: 18 }, // photo — 60px ~ 18mm
    1: { cellWidth: usable * 0.22 },
    2: { cellWidth: usable * 0.13 },
  };

  if (isFiltered) {
    colStyles[3] = { halign: "right", cellWidth: usable * 0.13 };
    colStyles[4] = { halign: "center", cellWidth: usable * 0.1 };
    colStyles[5] = { cellWidth: usable * 0.24 };
  } else {
    colStyles[3] = { cellWidth: usable * 0.16 }; // category
    colStyles[4] = { halign: "right", cellWidth: usable * 0.12 };
    colStyles[5] = { halign: "center", cellWidth: usable * 0.08 };
    colStyles[6] = { cellWidth: usable * 0.18 };
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [headRow],
    body: bodyRows,
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
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      valign: "middle",
      lineWidth: 0.2,
      lineColor: [229, 231, 235],
      minCellHeight: 18, // ~48px to fit images
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
    columnStyles: colStyles,
    didDrawCell: (data: any) => {
      if (data.section !== "body") return;
      const idx = data.row.index;

      // Photo column (always index 0)
      if (data.column.index === 0) {
        const imgData = imageCache[idx] || placeholderCache[idx];
        if (imgData) {
          const imgSize = 14; // ~48px
          const cellX = data.cell.x + (data.cell.width - imgSize) / 2;
          const cellY = data.cell.y + (data.cell.height - imgSize) / 2;
          try {
            doc.addImage(imgData, "PNG", cellX, cellY, imgSize, imgSize);
          } catch {
            // ignore
          }
        }
      }

      // Category badge column (only when not filtered)
      if (catColIdx >= 0 && data.column.index === catColIdx) {
        const part = parts[idx];
        if (part?.categoryColor && part?.categoryName) {
          const text = part.categoryName;
          const cellX = data.cell.x;
          const cellY = data.cell.y;
          const cellH = data.cell.height;
          const cellW = data.cell.width;

          // First, cover the auto-drawn text with background
          const isAlt = idx % 2 === 1;
          doc.setFillColor(isAlt ? 249 : 255, isAlt ? 250 : 255, isAlt ? 251 : 255);
          doc.rect(cellX + 0.2, cellY + 0.2, cellW - 0.4, cellH - 0.4, "F");

          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          const textW = doc.getTextWidth(text);
          const badgeW = textW + 8;
          const badgeH = 8;
          const bx = cellX + 3;
          const by = cellY + (cellH - badgeH) / 2;

          const [r, g, b] = hexToRgb(part.categoryColor);
          // Soft background
          doc.setFillColor(
            Math.min(r + 180, 255),
            Math.min(g + 180, 255),
            Math.min(b + 180, 255)
          );
          doc.roundedRect(bx, by, badgeW, badgeH, 2, 2, "F");

          doc.setTextColor(
            Math.max(r - 40, 0),
            Math.max(g - 40, 0),
            Math.max(b - 40, 0)
          );
          doc.text(text, bx + 4, by + 5.5);
          doc.setFont("helvetica", "normal");
        }
      }
    },
  });

  addFooter(doc, "Greenpac - Inventario de Repuestos");

  const suffix = categoryLabel ? "-" + categoryLabel.toLowerCase().replace(/\s+/g, "-") : "";
  doc.save("repuestos" + suffix + "-" + new Date().toISOString().slice(0, 10) + ".pdf");
}

export async function exportSuppliersPDF(suppliers: Supplier[]) {
  const logoDataUrl = await fetchAsDataURL("/brand/greenpac_logo_horizontal.png");
  const doc = new jsPDF({ orientation: "landscape" });

  addHeader(doc, logoDataUrl, "Base de Proveedores");

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.text("Total: " + suppliers.length + " proveedores", 14, 55);

  autoTable(doc, {
    startY: 62,
    head: [["Nombre", "Empresa", "CUIT", "Email", "Telefono", "Provincia", "Ciudad", "Categoria", "Repuestos"]],
    body: suppliers.map((s) => [
      s.name,
      s.company || "-",
      s.cuit || "-",
      s.email || "-",
      s.phone || "-",
      s.province || "-",
      s.city || "-",
      s.categoryName || "-",
      s.sparePartCount > 0 ? String(s.sparePartCount) : "-",
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

  addFooter(doc, "Greenpac - Base de Proveedores");
  doc.save("proveedores-" + new Date().toISOString().slice(0, 10) + ".pdf");
}
