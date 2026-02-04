/**
 * Converts an array of objects to CSV format and triggers download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    return;
  }

  // Create header row
  const headers = columns.map((col) => `"${col.label}"`).join(",");

  // Create data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) {
          return '""';
        }
        if (Array.isArray(value)) {
          return `"${value.join(", ")}"`;
        }
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  // Combine header and rows
  const csvContent = [headers, ...rows].join("\n");

  // Create blob and trigger download
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
