import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Download, MapPin, BarChart3, Filter, X, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, Building2, FileDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { exportToCSV } from "@/lib/exportCsv";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import jsPDF from "jspdf";

const COLORS = ["hsl(142,76%,36%)", "hsl(142,76%,46%)", "hsl(142,60%,56%)", "hsl(200,70%,50%)", "hsl(40,90%,50%)", "hsl(0,70%,50%)", "hsl(270,60%,50%)", "hsl(180,60%,40%)", "hsl(320,60%,50%)", "hsl(60,70%,45%)"];

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  approved: "Aprobada",
  rejected: "Rechazada",
  completed: "Completado",
  cancelled: "Cancelado",
};

type SortField = "total" | "sales" | "conversion" | "totalPrice";
type SortDir = "asc" | "desc";

const exportChartToPDF = (chartRef: React.RefObject<HTMLDivElement | null>, title: string) => {
  const el = chartRef.current;
  if (!el) return;
  const svg = el.querySelector("svg");
  if (!svg) { toast.error("No se encontró el gráfico"); return; }

  const doc = new jsPDF({ orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 80, 30);
  doc.rect(0, 0, pageW, 25, "F");
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GREENPAC — Reportes Zonales", 14, 17);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.text(title, 14, 38);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, pageW - 14, 38, { align: "right" });

  // Convert SVG to canvas
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx!.fillStyle = "white";
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
    ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = canvas.toDataURL("image/png");
    const ratio = Math.min((pageW - 28) / canvas.width, 120 / canvas.height);
    doc.addImage(imgData, "PNG", 14, 45, canvas.width * ratio, canvas.height * ratio);
    doc.save(`${title.replace(/\s/g, "-").toLowerCase()}.pdf`);
    toast.success("PDF descargado");
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
};

const ZonalReports = () => {
  const isMobile = useIsMobile();
  const [filterProvince, setFilterProvince] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);
  const [provinceSortField, setProvinceSortField] = useState<SortField>("total");
  const [provinceSortDir, setProvinceSortDir] = useState<SortDir>("desc");

  const provinceBarRef = useRef<HTMLDivElement>(null);
  const provincePieRef = useRef<HTMLDivElement>(null);
  const cityBarRef = useRef<HTMLDivElement>(null);
  const cityPieRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = filterProvince !== "all" || filterStatus !== "all" || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setFilterProvince("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const { data: quotations } = useQuery({
    queryKey: ["zonal-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("id, client_name, client_email, company, province, city, address_formatted, status, quotation_type, price, product_ids, created_at, created_by_employee_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!quotations) return [];
    return quotations.filter((q) => {
      if (filterProvince !== "all" && q.province !== filterProvince) return false;
      if (filterStatus !== "all" && q.status !== filterStatus) return false;
      if (filterDateFrom && q.created_at < filterDateFrom) return false;
      if (filterDateTo && q.created_at > filterDateTo + "T23:59:59") return false;
      return true;
    });
  }, [quotations, filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  const provinceStats = useMemo(() => {
    const map = new Map<string, { total: number; sales: number; totalPrice: number }>();
    filtered.forEach((q) => {
      const prov = q.province || "Sin provincia";
      const entry = map.get(prov) || { total: 0, sales: 0, totalPrice: 0 };
      entry.total++;
      if (q.status === "completed" || q.status === "approved") {
        entry.sales++;
        entry.totalPrice += Number(q.price) || 0;
      }
      map.set(prov, entry);
    });
    return Array.from(map.entries())
      .map(([province, stats]) => ({
        province,
        ...stats,
        conversion: stats.total > 0 ? ((stats.sales / stats.total) * 100) : 0,
      }))
      .sort((a, b) => {
        const aVal = a[provinceSortField] as number;
        const bVal = b[provinceSortField] as number;
        return provinceSortDir === "desc" ? bVal - aVal : aVal - bVal;
      });
  }, [filtered, provinceSortField, provinceSortDir]);

  // ALL cities (not just Buenos Aires)
  const allCityStats = useMemo(() => {
    const map = new Map<string, { total: number; sales: number; totalPrice: number; province: string }>();
    filtered.forEach((q) => {
      const city = q.city || "Sin ciudad";
      const entry = map.get(city) || { total: 0, sales: 0, totalPrice: 0, province: q.province || "" };
      entry.total++;
      if (q.status === "completed" || q.status === "approved") {
        entry.sales++;
        entry.totalPrice += Number(q.price) || 0;
      }
      map.set(city, entry);
    });
    const arr = Array.from(map.entries())
      .map(([city, stats]) => ({
        city,
        ...stats,
        conversion: stats.total > 0 ? ((stats.sales / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
    return arr;
  }, [filtered]);

  // Top N cities for charts + "Otras"
  const cityChartData = useMemo(() => {
    const limit = isMobile ? 8 : 12;
    const top = allCityStats.slice(0, limit);
    const rest = allCityStats.slice(limit);
    if (rest.length > 0) {
      const otrasTotal = rest.reduce((s, c) => s + c.total, 0);
      top.push({ city: "Otras", total: otrasTotal, sales: 0, totalPrice: 0, province: "", conversion: 0 });
    }
    return top;
  }, [allCityStats, isMobile]);

  const getProductNames = (ids: string[] | null) => {
    if (!ids || !products) return "";
    return products.filter((p) => ids.includes(p.id)).map((p) => p.name).join(", ");
  };

  const getEmployeeName = (id: string | null) => {
    if (!id || !employees) return "";
    return employees.find((e) => e.id === id)?.full_name || "";
  };

  const handleExportDetail = () => {
    if (filtered.length === 0) { toast.error("No hay datos para exportar"); return; }
    const data = filtered.map((q) => ({
      fecha: new Date(q.created_at).toLocaleDateString("es-AR"),
      cliente: q.client_name,
      email: q.client_email,
      empresa: q.company || "",
      provincia: q.province || "",
      ciudad: q.city || "",
      direccion: q.address_formatted || "",
      estado: statusLabels[q.status || "pending"] || q.status || "",
      tipo: q.quotation_type || "",
      precio: q.price != null ? String(q.price) : "",
      productos: getProductNames(q.product_ids),
      creada_por: getEmployeeName(q.created_by_employee_id),
    }));
    exportToCSV(data, `cotizaciones-detalle-zonal-${new Date().toISOString().split("T")[0]}`, [
      { key: "fecha", label: "Fecha" },
      { key: "cliente", label: "Cliente" },
      { key: "email", label: "Email" },
      { key: "empresa", label: "Empresa" },
      { key: "provincia", label: "Provincia" },
      { key: "ciudad", label: "Ciudad" },
      { key: "direccion", label: "Dirección" },
      { key: "estado", label: "Estado" },
      { key: "tipo", label: "Tipo" },
      { key: "precio", label: "Precio" },
      { key: "productos", label: "Productos" },
      { key: "creada_por", label: "Creada por" },
    ]);
    toast.success("CSV detalle descargado");
  };

  const handleExportSummary = () => {
    if (provinceStats.length === 0) { toast.error("No hay datos para exportar"); return; }
    const data = provinceStats.map((s) => ({
      provincia: s.province,
      cotizaciones: String(s.total),
      ventas: String(s.sales),
      conversion: s.conversion.toFixed(1) + "%",
      total_precio: s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "$0",
    }));
    exportToCSV(data, `resumen-zonal-${new Date().toISOString().split("T")[0]}`, [
      { key: "provincia", label: "Provincia" },
      { key: "cotizaciones", label: "Cotizaciones" },
      { key: "ventas", label: "Ventas" },
      { key: "conversion", label: "Conversión" },
      { key: "total_precio", label: "Total $" },
    ]);
    toast.success("CSV resumen descargado");
  };

  const handleExportAllPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 80, 30);
    doc.rect(0, 0, pageW, 25, "F");
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GREENPAC — Reportes Zonales Completo", 14, 17);
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, pageW - 14, 17, { align: "right" });

    let y = 35;

    // Province summary table
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.text("Resumen por Provincia", 14, y);
    y += 6;
    provinceStats.forEach((s) => {
      doc.setFontSize(9);
      doc.text(`${s.province}: ${s.total} cotiz. | ${s.sales} ventas | ${s.conversion.toFixed(1)}%`, 14, y);
      y += 5;
      if (y > 180) { doc.addPage(); y = 20; }
    });

    y += 8;
    doc.setFontSize(12);
    doc.text("Resumen por Ciudad (Top 15)", 14, y);
    y += 6;
    allCityStats.slice(0, 15).forEach((s) => {
      doc.setFontSize(9);
      doc.text(`${s.city} (${s.province}): ${s.total} cotiz. | ${s.sales} ventas`, 14, y);
      y += 5;
      if (y > 180) { doc.addPage(); y = 20; }
    });

    doc.save(`reportes-zonales-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF completo descargado");
  }, [provinceStats, allCityStats]);

  const toggleSort = (field: SortField) => {
    if (provinceSortField === field) {
      setProvinceSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setProvinceSortField(field);
      setProvinceSortDir("desc");
    }
  };

  const withProvince = filtered.filter((q) => q.province);
  const coveragePercent = filtered.length > 0 ? ((withProvince.length / filtered.length) * 100) : 0;
  const hasDataQualityIssue = filtered.length > 0 && coveragePercent < 50;

  const totalSales = filtered.filter((q) => q.status === "completed" || q.status === "approved");
  const totalRevenue = totalSales.reduce((sum, q) => sum + (Number(q.price) || 0), 0);

  const chartHeight = isMobile ? 240 : 340;
  const pieChartHeight = isMobile ? 280 : 340;

  // Province chart data limited for display
  const provinceChartData = useMemo(() => {
    const limit = isMobile ? 8 : 12;
    const top = provinceStats.slice(0, limit);
    const rest = provinceStats.slice(limit);
    if (rest.length > 0) {
      const otrasTotal = rest.reduce((s, p) => s + p.total, 0);
      top.push({ province: "Otras", total: otrasTotal, sales: 0, totalPrice: 0, conversion: 0 });
    }
    return top;
  }, [provinceStats, isMobile]);

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filtros
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
                    <X className="h-3.5 w-3.5" /> Limpiar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden h-8"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {!filtersOpen && hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5 mt-2 sm:hidden">
                {filterProvince !== "all" && (
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    {filterProvince}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterProvince("all")} />
                  </Badge>
                )}
                {filterStatus !== "all" && (
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    {statusLabels[filterStatus]}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStatus("all")} />
                  </Badge>
                )}
                {filterDateFrom && (
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    Desde: {filterDateFrom}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterDateFrom("")} />
                  </Badge>
                )}
                {filterDateTo && (
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    Hasta: {filterDateTo}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterDateTo("")} />
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          {(filtersOpen || !isMobile) && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select value={filterProvince} onValueChange={setFilterProvince}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Provincia" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las provincias</SelectItem>
                    {ARGENTINA_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} placeholder="Desde" className="w-full" />
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} placeholder="Hasta" className="w-full" />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Data quality hint */}
        {hasDataQualityIssue && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
            <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground text-xs sm:text-sm">
              Hay cotizaciones sin provincia/ciudad. Agregá provincia y ciudad para ver métricas más precisas.
            </p>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Total cotizaciones</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{filtered.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Ventas</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{totalSales.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Total $</p>
              <p className="text-lg sm:text-2xl font-bold mt-1 truncate">
                ${totalRevenue.toLocaleString("es-AR")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Cobertura geográfica</p>
              <div className="mt-1 space-y-1.5">
                <p className="text-xl sm:text-2xl font-bold">{coveragePercent.toFixed(0)}%</p>
                <Progress value={coveragePercent} className="h-1.5" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">{withProvince.length}/{filtered.length} con provincia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Download className="h-4 w-4" /> CSV Resumen <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportSummary}>
                <Download className="h-4 w-4 mr-2" /> Descargar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAllPDF}>
                <FileDown className="h-4 w-4 mr-2" /> PDF Gráficos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Download className="h-4 w-4" /> CSV Detalle <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportDetail}>
                <Download className="h-4 w-4 mr-2" /> Descargar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAllPDF}>
                <FileDown className="h-4 w-4 mr-2" /> PDF Gráficos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="default" className="gap-1.5" onClick={handleExportAllPDF}>
            <FileDown className="h-4 w-4" /> Exportar PDF (todos)
          </Button>
        </div>

        {/* Charts Row 1: Province bar + pie */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Cotizaciones por Provincia
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportChartToPDF(provinceBarRef, "Cotizaciones por Provincia")}>
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-1 sm:px-4">
              {provinceChartData.length > 0 ? (
                <div ref={provinceBarRef} className="w-full overflow-hidden flex justify-center">
                  <ResponsiveContainer width={provinceChartData.length <= 3 ? (isMobile ? "85%" : "60%") : "100%"} height={chartHeight}>
                    <BarChart data={provinceChartData} margin={{ left: 4, right: 16, top: 5, bottom: isMobile ? 60 : 40 }} barCategoryGap="30%" barGap={4}>
                      <XAxis
                        dataKey="province"
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                        angle={isMobile ? -45 : -25}
                        textAnchor="end"
                        interval={0}
                        height={isMobile ? 70 : 50}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                      <RechartsTooltip
                        formatter={(val: number) => [val, "Cotizaciones"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="total" fill="hsl(142,76%,36%)" radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 28 : 40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos con provincia</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Distribución por Provincia
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportChartToPDF(provincePieRef, "Distribución por Provincia")}>
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-1 sm:px-4">
              {provinceStats.length > 0 ? (
                <div ref={provincePieRef} className="w-full overflow-hidden flex justify-center">
                  <ResponsiveContainer width="100%" height={pieChartHeight}>
                    <PieChart>
                      <Pie
                        data={provinceStats.slice(0, 10)}
                        dataKey="total"
                        nameKey="province"
                        cx="50%"
                        cy={isMobile ? "40%" : "45%"}
                        outerRadius={isMobile ? 65 : 95}
                        innerRadius={isMobile ? 25 : 35}
                        label={false}
                      >
                        {provinceStats.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: number, _name: string, props: any) => [`${val} (${((val / filtered.length) * 100).toFixed(1)}%)`, props.payload.province]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 12 }}
                        iconSize={isMobile ? 8 : 10}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos con provincia</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: City bar + pie (ALL Argentina) */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Cotizaciones por Ciudad (Argentina)
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportChartToPDF(cityBarRef, "Cotizaciones por Ciudad")}>
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Agregá provincia y ciudad para ver métricas más precisas.</p>
            </CardHeader>
            <CardContent className="px-1 sm:px-4">
              {cityChartData.length > 0 ? (
                <div ref={cityBarRef} className="w-full overflow-hidden flex justify-center">
                  <ResponsiveContainer width={cityChartData.length <= 3 ? (isMobile ? "85%" : "60%") : "100%"} height={chartHeight}>
                    <BarChart data={cityChartData} margin={{ left: 4, right: 16, top: 5, bottom: isMobile ? 60 : 40 }} barCategoryGap="30%" barGap={4}>
                      <XAxis
                        dataKey="city"
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                        angle={isMobile ? -45 : -25}
                        textAnchor="end"
                        interval={0}
                        height={isMobile ? 70 : 50}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                      <RechartsTooltip
                        formatter={(val: number) => [val, "Cotizaciones"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="total" fill="hsl(200,70%,50%)" radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 28 : 40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin datos de ciudades. Agregá provincia y ciudad a las cotizaciones.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Distribución por Ciudad
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportChartToPDF(cityPieRef, "Distribución por Ciudad")}>
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-1 sm:px-4">
              {allCityStats.length > 0 ? (
                <div ref={cityPieRef} className="w-full overflow-hidden flex justify-center">
                  <ResponsiveContainer width="100%" height={pieChartHeight}>
                    <PieChart>
                      <Pie
                        data={allCityStats.slice(0, 10)}
                        dataKey="total"
                        nameKey="city"
                        cx="50%"
                        cy={isMobile ? "40%" : "45%"}
                        outerRadius={isMobile ? 65 : 95}
                        innerRadius={isMobile ? 25 : 35}
                        label={false}
                      >
                        {allCityStats.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: number, _name: string, props: any) => [`${val}`, props.payload.city]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 12 }}
                        iconSize={isMobile ? 8 : 10}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos de ciudades</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Province table */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Resumen por Provincia</CardTitle>
          </CardHeader>
          <CardContent>
            {provinceStats.length > 0 ? (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-card">Provincia</TableHead>
                        <TableHead className="text-right sticky top-0 bg-card cursor-pointer select-none" onClick={() => toggleSort("total")}>
                          <span className="inline-flex items-center gap-1">Cotizaciones <ArrowUpDown className="h-3 w-3" /></span>
                        </TableHead>
                        <TableHead className="text-right sticky top-0 bg-card cursor-pointer select-none" onClick={() => toggleSort("sales")}>
                          <span className="inline-flex items-center gap-1">Ventas <ArrowUpDown className="h-3 w-3" /></span>
                        </TableHead>
                        <TableHead className="text-right sticky top-0 bg-card cursor-pointer select-none" onClick={() => toggleSort("conversion")}>
                          <span className="inline-flex items-center gap-1">Conversión <ArrowUpDown className="h-3 w-3" /></span>
                        </TableHead>
                        <TableHead className="text-right sticky top-0 bg-card cursor-pointer select-none" onClick={() => toggleSort("totalPrice")}>
                          <span className="inline-flex items-center gap-1">Total $ <ArrowUpDown className="h-3 w-3" /></span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provinceStats.map((s) => (
                        <TableRow key={s.province}>
                          <TableCell className="font-medium">{s.province}</TableCell>
                          <TableCell className="text-right">{s.total}</TableCell>
                          <TableCell className="text-right">{s.sales}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={s.conversion > 50 ? "default" : "secondary"}>
                              {s.conversion.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="sm:hidden space-y-2">
                  {provinceStats.map((s) => (
                    <div key={s.province} className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{s.province}</span>
                        <Badge variant={s.conversion > 50 ? "default" : "secondary"} className="text-[10px]">
                          {s.conversion.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Cotiz.</p>
                          <p className="text-sm font-semibold">{s.total}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Ventas</p>
                          <p className="text-sm font-semibold">{s.sales}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Total $</p>
                          <p className="text-sm font-semibold truncate">{s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "-"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            )}
          </CardContent>
        </Card>

        {/* City table */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Detalle por Ciudad</CardTitle>
          </CardHeader>
          <CardContent>
            {allCityStats.length > 0 ? (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-card">Ciudad</TableHead>
                        <TableHead className="sticky top-0 bg-card">Provincia</TableHead>
                        <TableHead className="text-right sticky top-0 bg-card">Cotizaciones</TableHead>
                        <TableHead className="text-right sticky top-0 bg-card">Ventas</TableHead>
                        <TableHead className="text-right sticky top-0 bg-card">Conversión</TableHead>
                        <TableHead className="text-right sticky top-0 bg-card">Total $</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCityStats.slice(0, 20).map((s) => (
                        <TableRow key={s.city}>
                          <TableCell className="font-medium">{s.city}</TableCell>
                          <TableCell>{s.province}</TableCell>
                          <TableCell className="text-right">{s.total}</TableCell>
                          <TableCell className="text-right">{s.sales}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={s.conversion > 50 ? "default" : "secondary"}>
                              {s.conversion.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="sm:hidden space-y-2">
                  {allCityStats.slice(0, 20).map((s) => (
                    <div key={s.city} className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{s.city}</span>
                          <span className="text-[10px] text-muted-foreground ml-1.5">{s.province}</span>
                        </div>
                        <Badge variant={s.conversion > 50 ? "default" : "secondary"} className="text-[10px]">
                          {s.conversion.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Cotiz.</p>
                          <p className="text-sm font-semibold">{s.total}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Ventas</p>
                          <p className="text-sm font-semibold">{s.sales}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Total $</p>
                          <p className="text-sm font-semibold truncate">{s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "-"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default ZonalReports;
