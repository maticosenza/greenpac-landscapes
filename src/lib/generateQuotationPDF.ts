import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface QuotationData {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  company: string | null;
  quotation_type: string | null;
  status: string | null;
  message: string | null;
  price: number | null;
  created_at: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number | null;
}

const typeLabels: Record<string, string> = {
  quote: "Cotización",
  purchase: "Compra directa",
  deposit: "Seña / Reserva",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  approved: "Aprobada",
  rejected: "Rechazada",
  completed: "Completado",
  cancelled: "Cancelado",
};

export function generateQuotationPDF(quotation: QuotationData, products: ProductData[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(30, 80, 30);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo text
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("GREENPAC", 20, 27);

  // Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Soluciones para el campo", 20, 35);

  // Quotation title
  doc.setTextColor(30, 80, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const typeLabel = typeLabels[quotation.quotation_type || "quote"] || "Cotización";
  doc.text(typeLabel, 20, 55);

  // Date and ID
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date(quotation.created_at).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Fecha: ${dateStr}`, pageWidth - 20, 50, { align: "right" });
  doc.text(`Estado: ${statusLabels[quotation.status || "pending"] || "Pendiente"}`, pageWidth - 20, 56, { align: "right" });
  doc.text(`ID: ${quotation.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, 62, { align: "right" });

  // Client info section
  let y = 70;
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Cliente", 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const clientInfo = [
    ["Nombre", quotation.client_name],
    ["Email", quotation.client_email],
  ];
  if (quotation.client_phone) clientInfo.push(["Teléfono", quotation.client_phone]);
  if (quotation.company) clientInfo.push(["Empresa", quotation.company]);

  clientInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 55, y);
    y += 6;
  });

  // Products table
  if (products.length > 0) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Productos", 20, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Producto", "Descripción", "Precio Unit."]],
      body: products.map((p) => [
        p.name,
        p.description.length > 80 ? p.description.slice(0, 80) + "..." : p.description,
        p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "-",
      ]),
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 20, right: 20 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Total price
  if (quotation.price != null) {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(20, y, pageWidth - 40, 20, 3, 3, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 80, 30);
    doc.text("TOTAL:", 28, y + 13);
    doc.text(
      `$${Number(quotation.price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
      pageWidth - 28,
      y + 13,
      { align: "right" }
    );
    y += 28;
  }

  // Message
  if (quotation.message) {
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(quotation.message, pageWidth - 40);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 6;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Greenpac — Soluciones para el campo", pageWidth / 2, footerY, { align: "center" });
  doc.text("Este documento es una cotización estimativa y no constituye un compromiso de venta.", pageWidth / 2, footerY + 5, { align: "center" });

  doc.save(`cotizacion-${quotation.id.slice(0, 8)}.pdf`);
}
