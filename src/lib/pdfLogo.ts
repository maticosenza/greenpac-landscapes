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

  // Logo image (height ~14px, positioned vertically centered in header)
  const logoH = 14;
  const logoW = logoH * (320 / 72); // maintain aspect ratio
  doc.addImage(logoBase64, "PNG", 14, 8, logoW, logoH);

  // Subtitle on the right if provided
  if (subtitle) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageW - 14, 19, { align: "right" });
  }

  return 38;
}
