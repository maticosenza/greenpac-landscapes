import { useState, useMemo, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
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
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { exportToCSV } from "@/lib/exportCsv";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import jsPDF from "jspdf";


const COLORS = ["hsl(142,76%,36%)", "hsl(142,76%,46%)", "hsl(142,60%,56%)", "hsl(142,55%,62%)", "hsl(142,45%,70%)", "hsl(0,0%,75%)", "hsl(0,0%,60%)"];

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
  const kpisRef = useRef<HTMLDivElement>(null);
  const provinceRowRef = useRef<HTMLDivElement>(null);
  const cityRowRef = useRef<HTMLDivElement>(null);
  const provinceBarCardRef = useRef<HTMLDivElement>(null);
  const provincePieCardRef = useRef<HTMLDivElement>(null);
  const cityBarCardRef = useRef<HTMLDivElement>(null);
  const cityPieCardRef = useRef<HTMLDivElement>(null);

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

  const [cityViewAll, setCityViewAll] = useState(false);

  // City chart data: Top 10 + "Otras" or all
  const cityChartData = useMemo(() => {
    const sorted = [...allCityStats].sort((a, b) => b.total - a.total);
    const sinCity = sorted.find((c) => c.city === "Sin ciudad");
    const rest = sorted.filter((c) => c.city !== "Sin ciudad");

    if (cityViewAll) {
      return sinCity ? [sinCity, ...rest] : rest;
    }

    const top = rest.slice(0, 10);
    const remaining = rest.slice(10);
    const result: typeof top = [];
    if (sinCity) result.push(sinCity);
    result.push(...top);
    if (remaining.length > 0) {
      const otrasTotal = remaining.reduce((s, c) => s + c.total, 0);
      result.push({ city: "Otras", total: otrasTotal, sales: 0, totalPrice: 0, province: "", conversion: 0 });
    }
    return result;
  }, [allCityStats, cityViewAll]);

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

  const captureNode = async (node: HTMLElement): Promise<string> => {
    await document.fonts.ready;
    const prevOverflow = node.style.overflow;
    const prevMaxHeight = node.style.maxHeight;
    node.style.overflow = "visible";
    node.style.maxHeight = "none";
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
      return dataUrl;
    } finally {
      node.style.overflow = prevOverflow;
      node.style.maxHeight = prevMaxHeight;
    }
  };

  const buildFilterSummary = (): string => {
    const parts: string[] = [];
    if (filterProvince !== "all") parts.push(`Provincia: ${filterProvince}`);
    if (filterStatus !== "all") parts.push(`Estado: ${statusLabels[filterStatus] || filterStatus}`);
    if (filterDateFrom) parts.push(`Desde: ${filterDateFrom}`);
    if (filterDateTo) parts.push(`Hasta: ${filterDateTo}`);
    return parts.length > 0 ? parts.join(" | ") : "Sin filtros";
  };

  const drawSimpleHeader = (doc: jsPDF, subtitle: string): number => {
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 80, 30);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("GREENPAC", 14, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageW - 14, 15, { align: "right" });
    // Date + filters below header
    let y = 28;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}  |  ${buildFilterSummary()}`, 14, y);
    return y + 6;
  };

  const addImageToPdf = async (doc: jsPDF, imgData: string, y: number, maxH: number): Promise<number> => {
    const pageW = doc.internal.pageSize.getWidth();
    const availW = pageW - 20;
    // Load image to get natural dimensions
    const img = await new Promise<HTMLImageElement>((resolve) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.src = imgData;
    });
    const aspectRatio = img.naturalHeight / (img.naturalWidth || 1);
    let imgW = availW;
    let imgH = imgW * aspectRatio;
    if (imgH > maxH) {
      imgH = maxH;
      imgW = imgH / aspectRatio;
    }
    doc.addImage(imgData, "PNG", 10, y, imgW, imgH);
    return y + imgH + 4;
  };

  const handleExportProvincePDF = useCallback(async () => {
    if (!kpisRef.current || !provinceRowRef.current) { toast.error("No se encontró el contenido"); return; }
    toast.info("Generando PDF…");
    try {
      const [kpiImg, provImg] = await Promise.all([
        captureNode(kpisRef.current),
        captureNode(provinceRowRef.current),
      ]);
      const doc = new jsPDF({ orientation: "landscape" });
      let y = drawSimpleHeader(doc, "Reporte por Provincia");
      y = await addImageToPdf(doc, kpiImg, y, 40);
      y = await addImageToPdf(doc, provImg, y, 120);
      doc.save(`Reporte_B_Provincia.pdf`);
      toast.success("PDF Provincia descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error generando PDF");
    }
  }, [filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  const handleExportCityPDF = useCallback(async () => {
    if (!kpisRef.current || !cityRowRef.current) { toast.error("No se encontró el contenido"); return; }
    toast.info("Generando PDF…");
    try {
      const [kpiImg, cityImg] = await Promise.all([
        captureNode(kpisRef.current),
        captureNode(cityRowRef.current),
      ]);
      const doc = new jsPDF({ orientation: "landscape" });
      let y = drawSimpleHeader(doc, "Reporte por Ciudad");
      y = await addImageToPdf(doc, kpiImg, y, 40);
      y = await addImageToPdf(doc, cityImg, y, 120);
      doc.save(`Reporte_A_Ciudad.pdf`);
      toast.success("PDF Ciudad descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error generando PDF");
    }
  }, [filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  const handleExportAllPDF = useCallback(async () => {
    if (!kpisRef.current || !provinceRowRef.current || !cityRowRef.current) { toast.error("No se encontró el contenido"); return; }
    toast.info("Generando PDF completo…");
    try {
      const [kpiImg, provImg, cityImg] = await Promise.all([
        captureNode(kpisRef.current),
        captureNode(provinceRowRef.current),
        captureNode(cityRowRef.current),
      ]);
      const doc = new jsPDF({ orientation: "landscape" });
      // Page 1: KPIs + Province
      let y = drawSimpleHeader(doc, "Reportes Zonales Completo");
      y = await addImageToPdf(doc, kpiImg, y, 40);
      y = await addImageToPdf(doc, provImg, y, 120);
      // Page 2: KPIs + City
      doc.addPage();
      y = drawSimpleHeader(doc, "Reportes Zonales Completo");
      y = await addImageToPdf(doc, kpiImg, y, 40);
      y = await addImageToPdf(doc, cityImg, y, 120);
      doc.save(`reportes-zonales-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF completo descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error generando PDF");
    }
  }, [filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  const exportCardToPDF = useCallback(async (cardRef: React.RefObject<HTMLDivElement | null>, title: string) => {
    const node = cardRef.current;
    if (!node) { toast.error("No se encontró el contenido"); return; }
    toast.info("Generando PDF…");
    try {
      const cardImg = await captureNode(node);
      const doc = new jsPDF({ orientation: "landscape" });
      let y = drawSimpleHeader(doc, title);
      y = await addImageToPdf(doc, cardImg, y, 150);
      const filename = `reportes-zonas-${title.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}.pdf`;
      doc.save(filename);
      toast.success("PDF descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error generando PDF");
    }
  }, [filterProvince, filterStatus, filterDateFrom, filterDateTo]);

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

  const withCity = filtered.filter((q) => q.city);
  const cityCoveragePercent = filtered.length > 0 ? ((withCity.length / filtered.length) * 100) : 0;

  const missingProvince = filtered.length - withProvince.length;
  const missingCity = filtered.length - withCity.length;
  const missingProvincePct = filtered.length > 0 ? ((missingProvince / filtered.length) * 100) : 0;
  const missingCityPct = filtered.length > 0 ? ((missingCity / filtered.length) * 100) : 0;

  const totalSales = filtered.filter((q) => q.status === "completed" || q.status === "approved");
  const totalRevenue = totalSales.reduce((sum, q) => sum + (Number(q.price) || 0), 0);

  const chartHeight = isMobile ? 240 : 340;
  const pieChartHeight = isMobile ? 280 : 340;

  const [provinceViewAll, setProvinceViewAll] = useState(false);

  // Province chart data: Top 10 + "Otras" or all
  const provinceChartData = useMemo(() => {
    // Sort descending by total
    const sorted = [...provinceStats].sort((a, b) => b.total - a.total);
    // "Sin provincia" always first if exists
    const sinProv = sorted.find((p) => p.province === "Sin provincia");
    const rest = sorted.filter((p) => p.province !== "Sin provincia");

    if (provinceViewAll) {
      return sinProv ? [sinProv, ...rest] : rest;
    }

    const top = rest.slice(0, 10);
    const remaining = rest.slice(10);
    const result: typeof top = [];
    if (sinProv) result.push(sinProv);
    result.push(...top);
    if (remaining.length > 0) {
      const otrasTotal = remaining.reduce((s, p) => s + p.total, 0);
      result.push({ province: "Otras", total: otrasTotal, sales: 0, totalPrice: 0, conversion: 0 });
    }
    return result;
  }, [provinceStats, provinceViewAll]);

  const provinceBarHeight = useMemo(() => {
    const barH = isMobile ? 30 : 34;
    const minH = isMobile ? 260 : 320;
    return Math.max(minH, provinceChartData.length * barH + 80);
  }, [provinceChartData, isMobile]);

  const cityBarHeight = useMemo(() => {
    const barH = isMobile ? 30 : 34;
    const minH = isMobile ? 260 : 320;
    return Math.max(minH, cityChartData.length * barH + 80);
  }, [cityChartData, isMobile]);

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
        <div ref={kpisRef} className="space-y-3 sm:space-y-4">
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

        {/* Data quality & city coverage */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Cobertura ciudad</p>
              <div className="mt-1 space-y-1.5">
                <p className="text-xl sm:text-2xl font-bold">{cityCoveragePercent.toFixed(0)}%</p>
                <Progress value={cityCoveragePercent} className="h-1.5" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">{withCity.length}/{filtered.length} con ciudad</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Sin provincia</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{missingProvince}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{missingProvincePct.toFixed(1)}% del total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Sin ciudad</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{missingCity}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{missingCityPct.toFixed(1)}% del total</p>
            </CardContent>
          </Card>
        </div>
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
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportProvincePDF}>
            <FileDown className="h-4 w-4" /> PDF Provincia
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportCityPDF}>
            <FileDown className="h-4 w-4" /> PDF Ciudad
          </Button>
          <Button size="sm" variant="default" className="gap-1.5" onClick={handleExportAllPDF}>
            <FileDown className="h-4 w-4" /> Exportar PDF (todos)
          </Button>
        </div>

        {/* Charts Row 1: Province bar + pie */}
        <div ref={provinceRowRef} className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <div ref={provinceBarCardRef}>
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Cotizaciones por Provincia
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    <button
                      onClick={() => setProvinceViewAll(false)}
                      className={`px-2.5 py-1 transition-colors ${!provinceViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Top 10
                    </button>
                    <button
                      onClick={() => setProvinceViewAll(true)}
                      className={`px-2.5 py-1 transition-colors ${provinceViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Todas
                    </button>
                  </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportCardToPDF(provinceBarCardRef, "Cotizaciones por Provincia")}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 pt-4">
              {provinceChartData.length > 0 ? (() => {
                const rawMax = Math.max(...provinceChartData.map(d => d.total), 1);
                const xMax = Math.ceil(rawMax / 2) * 2;
                const xTicks: number[] = [];
                for (let i = 0; i <= xMax; i += 2) xTicks.push(i);
                return (
                <div
                  ref={provinceBarRef}
                  className="w-full"
                  style={{ overflowY: provinceViewAll && provinceChartData.length > 12 ? "auto" : "hidden", maxHeight: provinceViewAll && provinceChartData.length > 12 ? (isMobile ? 400 : 500) : undefined }}
                >
                  <ResponsiveContainer width="100%" height={provinceBarHeight}>
                    <BarChart
                      data={provinceChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 20, bottom: 30, left: 0 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 11 }} allowDecimals={false} tickLine={{ stroke: "hsl(var(--border))" }} axisLine={{ stroke: "hsl(var(--border))" }} domain={[0, xMax]} ticks={xTicks} />
                      <YAxis
                        type="category"
                        dataKey="province"
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        width={isMobile ? 100 : 130}
                        interval={0}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <RechartsTooltip
                        formatter={(val: number) => [val, "Cotizaciones"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="total" fill="hsl(142,76%,36%)" radius={[0, 4, 4, 0]} maxBarSize={isMobile ? 22 : 28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                );
              }) () : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos con provincia</p>
              )}
            </CardContent>
           </Card>
          </div>

          <div ref={provincePieCardRef}>
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Distribución por Provincia
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportCardToPDF(provincePieCardRef, "Distribución por Provincia")}>
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
                        {provinceStats.slice(0, 10).map((s, i) => (
                          <Cell key={i} fill={s.province === "Sin provincia" ? "hsl(0,0%,75%)" : COLORS[i % COLORS.length]} />
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
        </div>

        {/* Charts Row 2: City bar + pie (ALL Argentina) */}
        <div ref={cityRowRef} className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <div ref={cityBarCardRef}>
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Cotizaciones por Ciudad (Argentina)
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    <button
                      onClick={() => setCityViewAll(false)}
                      className={`px-2.5 py-1 transition-colors ${!cityViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Top 10
                    </button>
                    <button
                      onClick={() => setCityViewAll(true)}
                      className={`px-2.5 py-1 transition-colors ${cityViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Todas
                    </button>
                  </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportCardToPDF(cityBarCardRef, "Cotizaciones por Ciudad")}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Agregá provincia y ciudad para ver métricas más precisas.</p>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 pt-4">
              {cityChartData.length > 0 ? (() => {
                const rawMax = Math.max(...cityChartData.map(d => d.total), 1);
                const xMax = Math.ceil(rawMax / 2) * 2;
                const xTicks: number[] = [];
                for (let i = 0; i <= xMax; i += 2) xTicks.push(i);
                return (
                <div
                  ref={cityBarRef}
                  className="w-full"
                  style={{ overflowY: cityViewAll && cityChartData.length > 12 ? "auto" : "hidden", maxHeight: cityViewAll && cityChartData.length > 12 ? (isMobile ? 400 : 500) : undefined }}
                >
                  <ResponsiveContainer width="100%" height={cityBarHeight}>
                    <BarChart
                      data={cityChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 20, bottom: 30, left: 0 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 11 }} allowDecimals={false} tickLine={{ stroke: "hsl(var(--border))" }} axisLine={{ stroke: "hsl(var(--border))" }} domain={[0, xMax]} ticks={xTicks} />
                      <YAxis
                        type="category"
                        dataKey="city"
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        width={isMobile ? 100 : 130}
                        interval={0}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <RechartsTooltip
                        formatter={(val: number) => [val, "Cotizaciones"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="total" fill="hsl(142,76%,36%)" radius={[0, 4, 4, 0]} maxBarSize={isMobile ? 22 : 28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                );
              }) () : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin datos de ciudades. Agregá provincia y ciudad a las cotizaciones.
                </p>
              )}
            </CardContent>
          </Card>
          </div>

          <div ref={cityPieCardRef}>
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Distribución por Ciudad
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportCardToPDF(cityPieCardRef, "Distribución por Ciudad")}>
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
                        {allCityStats.slice(0, 10).map((s, i) => (
                          <Cell key={i} fill={s.city === "Sin ciudad" ? "hsl(0,0%,75%)" : COLORS[i % COLORS.length]} />
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
