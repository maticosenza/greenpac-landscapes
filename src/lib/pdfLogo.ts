import jsPDF from "jspdf";

const LOGO_URL = "/images/greenpac-pdf-logo.png";

let cachedLogo: string | null = null;

export async function loadPdfLogo(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const res = await fetch(LOGO_URL);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      cachedLogo = reader.result as string;
      resolve(cachedLogo);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Draws the standard PDF header with logo on a dark green bar.
 * Returns the Y position after the header.
 */
export function drawPdfHeader(doc: jsPDF, logoBase64: string, subtitle?: string): number {
  const pageW = doc.internal.pageSize.getWidth();

  // Dark green header bar
  doc.setFillColor(30, 80, 30);
  doc.rect(0, 0, pageW, 30, "F");

  // Round green logo (square aspect, height ~18px, vertically centered)
  const logoH = 18;
  const logoW = logoH; // square logo
  doc.addImage(logoBase64, "PNG", 10, 6, logoW, logoH);

  // White "GREENPAC" text next to the logo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GREENPAC", 10 + logoW + 4, 19);

  // Subtitle on the right if provided
  if (subtitle) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageW - 14, 19, { align: "right" });
  }

  return 38;
}
