export const CLIENT_STATUSES = [
  { value: "activo", label: "Activo", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "en_seguimiento", label: "En seguimiento", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "negociacion", label: "En negociación", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "cerrado", label: "Cerrado", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "inactivo", label: "Inactivo", color: "bg-gray-100 text-gray-800 border-gray-200" },
] as const;

export const getStatusInfo = (status: string) =>
  CLIENT_STATUSES.find((s) => s.value === status) ?? CLIENT_STATUSES[0];
