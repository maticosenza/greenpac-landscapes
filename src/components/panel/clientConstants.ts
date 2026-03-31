export const CLIENT_STATUSES = [
  { value: "activo", label: "Activo", color: "bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]" },
  { value: "en_seguimiento", label: "En seguimiento", color: "bg-[#fef9c3] text-[#854d0e] border-[#fef08a]" },
  { value: "negociacion", label: "En negociación", color: "bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]" },
  { value: "cerrado", label: "Cerrado", color: "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]" },
  { value: "inactivo", label: "Inactivo", color: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" },
] as const;

export const STATUS_BADGE_CLASS = "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 h-6 text-xs font-semibold min-w-[110px]";

export const getStatusInfo = (status: string) =>
  CLIENT_STATUSES.find((s) => s.value === status) ?? CLIENT_STATUSES[0];
