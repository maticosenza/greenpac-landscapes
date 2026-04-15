import { useState, useMemo, useRef, useCallback, lazy, Suspense } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Download, MapPin, BarChart3, Filter, X, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, Building2, FileDown, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { exportToCSV } from "@/lib/exportCsv";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import { CLIENT_STATUSES, getStatusInfo } from "./clientConstants";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ClientsMap = lazy(() => import("./ClientsMap"));

const COLORS = ["hsl(142,76%,36%)", "hsl(142,76%,46%)", "hsl(142,60%,56%)", "hsl(142,55%,62%)", "hsl(142,45%,70%)", "hsl(0,0%,75%)", "hsl(0,0%,60%)"];

type SortField = "total" | "withPrice" | "avgPrice" | "totalPrice";
type SortDir = "asc" | "desc";

let cachedLogoDataUrl: string | null = null;
async function getLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const res = await fetch("/brand/greenpac_logo_1200x270_transparent.png");
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  cachedLogoDataUrl = dataUrl;
  return dataUrl;
}

interface ClientRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  product_interest: string | null;
  price: number | null;
  province: string | null;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

const ClientZonalReports = () => {
  const isMobile = useIsMobile();
  const [filterProvince, setFilterProvince] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);
  const [provinceSortField, setProvinceSortField] = useState<SortField>("total");
  const [provinceSortDir, setProvinceSortDir] = useState<SortDir>("desc");

  const provinceRowRef = useRef<HTMLDivElement>(null);
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

  const { data: clients } = useQuery({
    queryKey: ["client-zonal-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as ClientRow[];
    },
  });

  const { data: vendedorNames } = useQuery({
    queryKey: ["vendedor-names-for-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { map[p.id] = p.full_name; });
      return map;
    },
  });


  const filtered = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => {
      if (filterProvince !== "all" && c.province !== filterProvince) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterDateFrom && c.created_at < filterDateFrom) return false;
      if (filterDateTo && c.created_at > filterDateTo + "T23:59:59") return false;
      return true;
    });
  }, [clients, filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  const provinceStats = useMemo(() => {
    const map = new Map<string, { total: number; withPrice: number; totalPrice: number }>();
    filtered.forEach((c) => {
      const prov = c.province || "Sin provincia";
      const entry = map.get(prov) || { total: 0, withPrice: 0, totalPrice: 0 };
      entry.total++;
      if (c.price != null && c.price > 0) {
        entry.withPrice++;
        entry.totalPrice += Number(c.price);
      }
      map.set(prov, entry);
    });
    return Array.from(map.entries())
      .map(([province, stats]) => ({
        province,
        ...stats,
        avgPrice: stats.withPrice > 0 ? stats.totalPrice / stats.withPrice : 0,
      }))
      .sort((a, b) => {
        const aVal = a[provinceSortField] as number;
        const bVal = b[provinceSortField] as number;
        return provinceSortDir === "desc" ? bVal - aVal : aVal - bVal;
      });
  }, [filtered, provinceSortField, provinceSortDir]);

  const allCityStats = useMemo(() => {
    const map = new Map<string, { total: number; withPrice: number; totalPrice: number; province: string }>();
    filtered.forEach((c) => {
      const city = c.city || "Sin ciudad";
      const entry = map.get(city) || { total: 0, withPrice: 0, totalPrice: 0, province: c.province || "" };
      entry.total++;
      if (c.price != null && c.price > 0) {
        entry.withPrice++;
        entry.totalPrice += Number(c.price);
      }
      map.set(city, entry);
    });
    return Array.from(map.entries())
      .map(([city, stats]) => ({
        city,
        ...stats,
        avgPrice: stats.withPrice > 0 ? stats.totalPrice / stats.withPrice : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Status distribution for extra insight
  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((c) => {
      const label = getStatusInfo(c.status).label;
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Product interest distribution
  const productDistribution = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((c) => {
      const prod = c.product_interest || "Sin especificar";
      map.set(prod, (map.get(prod) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const [provinceViewAll, setProvinceViewAll] = useState(false);
  const [cityViewAll, setCityViewAll] = useState(false);

  const provinceChartData = useMemo(() => {
    const sorted = [...provinceStats].sort((a, b) => b.total - a.total);
    const sinProv = sorted.find((p) => p.province === "Sin provincia");
    const rest = sorted.filter((p) => p.province !== "Sin provincia");
    if (provinceViewAll) return sinProv ? [sinProv, ...rest] : rest;
    const top = rest.slice(0, 10);
    const remaining = rest.slice(10);
    const result: typeof top = [];
    if (sinProv) result.push(sinProv);
    result.push(...top);
    if (remaining.length > 0) {
      const otrasTotal = remaining.reduce((s, p) => s + p.total, 0);
      result.push({ province: "Otras", total: otrasTotal, withPrice: 0, totalPrice: 0, avgPrice: 0 });
    }
    return result;
  }, [provinceStats, provinceViewAll]);

  const cityChartData = useMemo(() => {
    const sorted = [...allCityStats].sort((a, b) => b.total - a.total);
    const sinCity = sorted.find((c) => c.city === "Sin ciudad");
    const rest = sorted.filter((c) => c.city !== "Sin ciudad");
    if (cityViewAll) return sinCity ? [sinCity, ...rest] : rest;
    const top = rest.slice(0, 10);
    const remaining = rest.slice(10);
    const result: typeof top = [];
    if (sinCity) result.push(sinCity);
    result.push(...top);
    if (remaining.length > 0) {
      const otrasTotal = remaining.reduce((s, c) => s + c.total, 0);
      result.push({ city: "Otras", total: otrasTotal, withPrice: 0, totalPrice: 0, province: "", avgPrice: 0 });
    }
    return result;
  }, [allCityStats, cityViewAll]);

  const withProvince = filtered.filter((c) => c.province);
  const coveragePercent = filtered.length > 0 ? ((withProvince.length / filtered.length) * 100) : 0;
  const hasDataQualityIssue = filtered.length > 0 && coveragePercent < 50;
  const withCity = filtered.filter((c) => c.city);
  const cityCoveragePercent = filtered.length > 0 ? ((withCity.length / filtered.length) * 100) : 0;
  const missingProvince = filtered.length - withProvince.length;
  const missingCity = filtered.length - withCity.length;
  const missingProvincePct = filtered.length > 0 ? ((missingProvince / filtered.length) * 100) : 0;
  const missingCityPct = filtered.length > 0 ? ((missingCity / filtered.length) * 100) : 0;

  const totalWithPrice = filtered.filter((c) => c.price != null && Number(c.price) > 0);
  const totalRevenue = totalWithPrice.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const avgRevenue = totalWithPrice.length > 0 ? totalRevenue / totalWithPrice.length : 0;

  const chartHeight = isMobile ? 240 : 340;
  const pieChartHeight = isMobile ? 280 : 340;

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

  const toggleSort = (field: SortField) => {
    if (provinceSortField === field) {
      setProvinceSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setProvinceSortField(field);
      setProvinceSortDir("desc");
    }
  };

  // Export CSV
  const handleExportDetail = () => {
    if (filtered.length === 0) { toast.error("No hay datos para exportar"); return; }
    const data = filtered.map((c) => ({
      fecha: new Date(c.created_at).toLocaleDateString("es-AR"),
      nombre: c.full_name,
      email: c.email || "",
      telefono: c.phone || "",
      documento: c.document || "",
      producto: c.product_interest || "",
      precio: c.price != null ? String(c.price) : "",
      provincia: c.province || "",
      ciudad: c.city || "",
      codigo_postal: c.postal_code || "",
      domicilio: c.address || "",
      estado: getStatusInfo(c.status).label,
    }));
    exportToCSV(data, `clientes-detalle-zonal-${new Date().toISOString().split("T")[0]}`, [
      { key: "fecha", label: "Fecha" },
      { key: "nombre", label: "Nombre" },
      { key: "email", label: "Email" },
      { key: "telefono", label: "Teléfono" },
      { key: "documento", label: "Documento" },
      { key: "producto", label: "Producto de Interés" },
      { key: "precio", label: "Precio" },
      { key: "provincia", label: "Provincia" },
      { key: "ciudad", label: "Ciudad" },
      { key: "codigo_postal", label: "Código Postal" },
      { key: "domicilio", label: "Domicilio" },
      { key: "estado", label: "Estado" },
    ]);
    toast.success("CSV detalle descargado");
  };

  const handleExportSummary = () => {
    if (provinceStats.length === 0) { toast.error("No hay datos para exportar"); return; }
    const data = provinceStats.map((s) => ({
      provincia: s.province,
      clientes: String(s.total),
      con_precio: String(s.withPrice),
      precio_promedio: s.avgPrice > 0 ? `$${s.avgPrice.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "$0",
      total_precio: s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "$0",
    }));
    exportToCSV(data, `clientes-resumen-zonal-${new Date().toISOString().split("T")[0]}`, [
      { key: "provincia", label: "Provincia" },
      { key: "clientes", label: "Clientes" },
      { key: "con_precio", label: "Con Precio" },
      { key: "precio_promedio", label: "Precio Promedio" },
      { key: "total_precio", label: "Total $" },
    ]);
    toast.success("CSV resumen descargado");
  };

  // PDF helpers
  const capturePng = async (node: HTMLElement): Promise<string> => {
    await document.fonts?.ready;
    const prev = {
      overflow: node.style.overflow, overflowY: node.style.overflowY,
      maxHeight: node.style.maxHeight, height: node.style.height,
      width: node.style.width, padding: node.style.padding,
    };
    node.style.overflow = "visible";
    node.style.overflowY = "visible";
    node.style.maxHeight = "none";
    node.style.height = node.scrollHeight + 8 + "px";
    node.style.width = node.scrollWidth + "px";
    node.style.padding = "6px";
    try {
      return await toPng(node, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff", width: node.scrollWidth, height: node.scrollHeight + 8 });
    } finally {
      Object.assign(node.style, prev);
    }
  };

  const buildFilterSummary = (): string => {
    const parts: string[] = [];
    if (filterProvince !== "all") parts.push(`Provincia: ${filterProvince}`);
    if (filterStatus !== "all") parts.push(`Estado: ${getStatusInfo(filterStatus).label}`);
    if (filterDateFrom) parts.push(`Desde: ${filterDateFrom}`);
    if (filterDateTo) parts.push(`Hasta: ${filterDateTo}`);
    return parts.length > 0 ? parts.join(" | ") : "Sin filtros";
  };

  const drawPdfHeader = async (doc: jsPDF, title: string): Promise<number> => {
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 80, 30);
    doc.rect(0, 0, pageW, 20, "F");
    try {
      const logo = await getLogoDataUrl();
      const logoH = 10;
      const logoW = logoH * (1200 / 270);
      doc.addImage(logo, "PNG", 12, 5, logoW, logoH);
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("GREENPAC", 14, 14);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, pageW - 12, 13, { align: "right" });
    const y = 26;
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}  |  ${buildFilterSummary()}`, 14, y);
    return y + 6;
  };

  const addImageToPdf = async (doc: jsPDF, imgData: string, y: number): Promise<number> => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const availW = pageW - margin * 2;
    const availH = pageH - y - 6;
    const img = await new Promise<HTMLImageElement>((resolve) => {
      const i = new Image(); i.onload = () => resolve(i); i.src = imgData;
    });
    const ratio = img.naturalHeight / (img.naturalWidth || 1);
    let imgW = availW;
    let imgH = imgW * ratio;
    if (imgH > availH) { imgH = availH; imgW = imgH / ratio; }
    const xOffset = margin + (availW - imgW) / 2;
    doc.addImage(imgData, "PNG", xOffset, y, imgW, imgH);
    return y + imgH + 3;
  };

  const addTwoCardsToPdf = async (doc: jsPDF, leftImg: string, rightImg: string, y: number): Promise<number> => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const gap = 6;
    const cardW = (pageW - margin * 2 - gap) / 2;
    const availH = pageH - y - 6;
    const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve) => {
      const i = new Image(); i.onload = () => resolve(i); i.src = src;
    });
    const [imgL, imgR] = await Promise.all([loadImg(leftImg), loadImg(rightImg)]);
    const ratioL = imgL.naturalHeight / (imgL.naturalWidth || 1);
    const ratioR = imgR.naturalHeight / (imgR.naturalWidth || 1);
    let cardH = Math.max(cardW * ratioL, cardW * ratioR);
    if (cardH > availH) cardH = availH;
    const fitImg = (ratio: number) => {
      let w = cardW, h = w * ratio;
      if (h > cardH) { h = cardH; w = h / ratio; }
      return { w, h };
    };
    const left = fitImg(ratioL);
    const right = fitImg(ratioR);
    doc.addImage(leftImg, "PNG", margin + (cardW - left.w) / 2, y + (cardH - left.h) / 2, left.w, left.h);
    doc.addImage(rightImg, "PNG", margin + cardW + gap + (cardW - right.w) / 2, y + (cardH - right.h) / 2, right.w, right.h);
    return y + cardH + 3;
  };

  const handleExportProvincePDF = useCallback(async () => {
    if (!provinceRowRef.current) { toast.error("No se encontró el contenido"); return; }
    toast.info("Generando PDF…");
    try {
      const provImg = await capturePng(provinceRowRef.current);
      const doc = new jsPDF({ orientation: "landscape" });
      let y = await drawPdfHeader(doc, "Clientes por Provincia");
      y = await addImageToPdf(doc, provImg, y);
      doc.addPage();
      const y2 = await drawPdfHeader(doc, "Detalle por Provincia");
      doc.setTextColor(30, 80, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detalle por Provincia", 14, y2 + 4);
      autoTable(doc, {
        startY: y2 + 8,
        head: [["Provincia", "Clientes", "Con Precio", "Precio Prom.", "Total $"]],
        body: provinceChartData.map((s) => [
          s.province, String(s.total), String(s.withPrice),
          s.avgPrice > 0 ? `$${s.avgPrice.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "$0",
          s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "$0",
        ]),
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        theme: "grid",
        margin: { left: 14, right: 14 },
      });
      doc.save(`clientes-zona-provincia.pdf`);
      toast.success("PDF Provincia descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error generando PDF");
    }
  }, [provinceChartData, filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  const handleExportCityPDF = useCallback(async () => {
    if (!cityBarCardRef.current || !cityPieCardRef.current) { toast.error("No se encontró el contenido"); return; }
    toast.info("Generando PDF…");
    try {
      const [barImg, pieImg] = await Promise.all([
        capturePng(cityBarCardRef.current),
        capturePng(cityPieCardRef.current),
      ]);
      const doc = new jsPDF({ orientation: "landscape" });
      let y = await drawPdfHeader(doc, "Clientes por Ciudad");
      y = await addTwoCardsToPdf(doc, barImg, pieImg, y);
      doc.addPage();
      const y2 = await drawPdfHeader(doc, "Detalle por Ciudad");
      doc.setTextColor(30, 80, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detalle por Ciudad", 14, y2 + 4);
      autoTable(doc, {
        startY: y2 + 8,
        head: [["Ciudad", "Provincia", "Clientes", "Con Precio", "Total $"]],
        body: cityChartData.map((s) => [
          s.city, s.province || "-", String(s.total), String(s.withPrice),
          s.totalPrice > 0 ? `$${s.totalPrice.toLocaleString("es-AR")}` : "$0",
        ]),
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        theme: "grid",
        margin: { left: 14, right: 14 },
      });
      doc.save(`clientes-zona-ciudad.pdf`);
      toast.success("PDF Ciudad descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error generando PDF");
    }
  }, [cityChartData, filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  const exportCardToPDF = useCallback(async (cardRef: React.RefObject<HTMLDivElement | null>, title: string) => {
    const node = cardRef.current;
    if (!node) { toast.error("No se encontró el contenido"); return; }
    toast.info("Generando PDF…");
    try {
      const cardImg = await capturePng(node);
      const doc = new jsPDF({ orientation: "landscape" });
      let y = await drawPdfHeader(doc, title);
      await addImageToPdf(doc, cardImg, y);
      doc.save(`clientes-zona-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
      toast.success("PDF descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error generando PDF");
    }
  }, [filterProvince, filterStatus, filterDateFrom, filterDateTo]);

  return (
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
              <Button variant="ghost" size="sm" className="sm:hidden h-8" onClick={() => setFiltersOpen(!filtersOpen)}>
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
                  {getStatusInfo(filterStatus).label}
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
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full h-9 text-sm" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {hasDataQualityIssue && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground text-xs sm:text-sm">
            Hay clientes sin provincia/ciudad. Completá los datos geográficos para métricas más precisas.
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="space-y-3 sm:space-y-4 bg-background p-3 rounded-lg">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Total clientes</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{filtered.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Con precio</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{totalWithPrice.length}</p>
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
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Precio promedio</p>
              <p className="text-lg sm:text-2xl font-bold mt-1 truncate">
                ${avgRevenue.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Cobertura provincia</p>
              <div className="mt-1 space-y-1.5">
                <p className="text-xl sm:text-2xl font-bold">{coveragePercent.toFixed(0)}%</p>
                <Progress value={coveragePercent} className="h-1.5" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">{withProvince.length}/{filtered.length} con provincia</p>
              </div>
            </CardContent>
          </Card>
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
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">Provincias únicas</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{provinceStats.filter(s => s.province !== "Sin provincia").length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{allCityStats.filter(s => s.city !== "Sin ciudad").length} ciudades</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportSummary}>
          <Download className="h-4 w-4" /> CSV Resumen
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportDetail}>
          <Download className="h-4 w-4" /> CSV Detalle
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportProvincePDF}>
          <FileDown className="h-4 w-4" /> PDF Provincia
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportCityPDF}>
          <FileDown className="h-4 w-4" /> PDF Ciudad
        </Button>
      </div>

      {/* Interactive Map */}
      <Suspense fallback={<div className="h-[520px] rounded-lg border bg-muted/20 animate-pulse flex items-center justify-center text-muted-foreground text-sm">Cargando mapa…</div>}>
        <ClientsMap clients={filtered} vendedorNames={vendedorNames} />
      </Suspense>

      {/* Province bar + pie */}
      <div ref={provinceRowRef} className="grid lg:grid-cols-2 gap-4 sm:gap-6 bg-background p-3 rounded-lg">
        <div ref={provinceBarCardRef} className="bg-background p-1 rounded-lg">
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Clientes por Provincia
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    <button onClick={() => setProvinceViewAll(false)} className={`px-2.5 py-1 transition-colors ${!provinceViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>Top 10</button>
                    <button onClick={() => setProvinceViewAll(true)} className={`px-2.5 py-1 transition-colors ${provinceViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>Todas</button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportCardToPDF(provinceBarCardRef, "Clientes por Provincia")}>
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
                  <div className="w-full" style={{ overflowY: provinceViewAll && provinceChartData.length > 12 ? "auto" : "hidden", maxHeight: provinceViewAll && provinceChartData.length > 12 ? (isMobile ? 400 : 500) : undefined }}>
                    <ResponsiveContainer width="100%" height={provinceBarHeight}>
                      <BarChart data={provinceChartData} layout="vertical" margin={{ top: 10, right: 20, bottom: 30, left: 0 }} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 11 }} allowDecimals={false} domain={[0, xMax]} ticks={xTicks} />
                        <YAxis type="category" dataKey="province" tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 100 : 130} interval={0} />
                        <RechartsTooltip formatter={(val: number) => [val, "Clientes"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="total" fill="hsl(142,76%,36%)" radius={[0, 4, 4, 0]} maxBarSize={isMobile ? 22 : 28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })() : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos con provincia</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div ref={provincePieCardRef} className="bg-background p-1 rounded-lg">
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
                <div className="w-full overflow-hidden flex justify-center">
                  <ResponsiveContainer width="100%" height={pieChartHeight}>
                    <PieChart>
                      <Pie data={provinceStats.slice(0, 10)} dataKey="total" nameKey="province" cx="50%" cy={isMobile ? "40%" : "45%"} outerRadius={isMobile ? 65 : 95} innerRadius={isMobile ? 25 : 35} label={false}>
                        {provinceStats.slice(0, 10).map((s, i) => (
                          <Cell key={i} fill={s.province === "Sin provincia" ? "hsl(0,0%,75%)" : COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: number, _name: string, props: any) => [`${val} (${((val / filtered.length) * 100).toFixed(1)}%)`, props.payload.province]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 12 }} iconSize={isMobile ? 8 : 10} />
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

      {/* City bar + pie */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 bg-background p-3 rounded-lg">
        <div ref={cityBarCardRef} className="bg-background p-1 rounded-lg h-full">
          <Card className="h-full">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Clientes por Ciudad
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    <button onClick={() => setCityViewAll(false)} className={`px-2.5 py-1 transition-colors ${!cityViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>Top 10</button>
                    <button onClick={() => setCityViewAll(true)} className={`px-2.5 py-1 transition-colors ${cityViewAll ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>Todas</button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => exportCardToPDF(cityBarCardRef, "Clientes por Ciudad")}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 pt-4">
              {cityChartData.length > 0 ? (() => {
                const rawMax = Math.max(...cityChartData.map(d => d.total), 1);
                const xMax = Math.ceil(rawMax / 2) * 2;
                const xTicks: number[] = [];
                for (let i = 0; i <= xMax; i += 2) xTicks.push(i);
                return (
                  <div className="w-full" style={{ overflowY: cityViewAll && cityChartData.length > 12 ? "auto" : "hidden", maxHeight: cityViewAll && cityChartData.length > 12 ? (isMobile ? 400 : 500) : undefined }}>
                    <ResponsiveContainer width="100%" height={cityBarHeight}>
                      <BarChart data={cityChartData} layout="vertical" margin={{ top: 10, right: 20, bottom: 30, left: 0 }} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 11 }} allowDecimals={false} domain={[0, xMax]} ticks={xTicks} />
                        <YAxis type="category" dataKey="city" tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 100 : 130} interval={0} />
                        <RechartsTooltip formatter={(val: number) => [val, "Clientes"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="total" fill="hsl(142,76%,36%)" radius={[0, 4, 4, 0]} maxBarSize={isMobile ? 22 : 28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })() : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos de ciudades</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div ref={cityPieCardRef} className="bg-background p-1 rounded-lg h-full">
          <Card className="h-full flex flex-col">
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
            <CardContent className="px-1 sm:px-4 flex-1 flex flex-col justify-center">
              {allCityStats.length > 0 ? (
                <div className="w-full overflow-hidden flex justify-center">
                  <ResponsiveContainer width="100%" height={pieChartHeight}>
                    <PieChart>
                      <Pie data={allCityStats.slice(0, 10)} dataKey="total" nameKey="city" cx="50%" cy={isMobile ? "40%" : "45%"} outerRadius={isMobile ? 65 : 95} innerRadius={isMobile ? 25 : 35} label={false}>
                        {allCityStats.slice(0, 10).map((s, i) => (
                          <Cell key={i} fill={s.city === "Sin ciudad" ? "hsl(0,0%,75%)" : COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: number, _name: string, props: any) => [`${val}`, props.payload.city]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 12 }} iconSize={isMobile ? 8 : 10} />
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

      {/* Status distribution pie */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            {statusDistribution.length > 0 ? (
              <div className="w-full overflow-hidden flex justify-center">
                <ResponsiveContainer width="100%" height={pieChartHeight}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy={isMobile ? "40%" : "45%"} outerRadius={isMobile ? 65 : 95} innerRadius={isMobile ? 25 : 35} label={false}>
                      {statusDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: number, _name: string, props: any) => [`${val} (${((val / filtered.length) * 100).toFixed(1)}%)`, props.payload.name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 12 }} iconSize={isMobile ? 8 : 10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Interés por Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            {productDistribution.length > 0 ? (
              <div className="w-full overflow-hidden flex justify-center">
                <ResponsiveContainer width="100%" height={pieChartHeight}>
                  <PieChart>
                    <Pie data={productDistribution.slice(0, 8)} dataKey="value" nameKey="name" cx="50%" cy={isMobile ? "40%" : "45%"} outerRadius={isMobile ? 65 : 95} innerRadius={isMobile ? 25 : 35} label={false}>
                      {productDistribution.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: number, _name: string, props: any) => [`${val}`, props.payload.name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 12 }} iconSize={isMobile ? 8 : 10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Province summary table */}
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
                        <span className="inline-flex items-center gap-1">Clientes <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="text-right sticky top-0 bg-card cursor-pointer select-none" onClick={() => toggleSort("withPrice")}>
                        <span className="inline-flex items-center gap-1">Con Precio <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="text-right sticky top-0 bg-card cursor-pointer select-none" onClick={() => toggleSort("avgPrice")}>
                        <span className="inline-flex items-center gap-1">Precio Prom. <ArrowUpDown className="h-3 w-3" /></span>
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
                        <TableCell className="text-right">{s.withPrice}</TableCell>
                        <TableCell className="text-right">
                          {s.avgPrice > 0 ? `$${s.avgPrice.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "-"}
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
                      <span className="text-sm font-bold">{s.total}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Clientes</p>
                        <p className="text-sm font-semibold">{s.total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Precio Prom.</p>
                        <p className="text-sm font-semibold">{s.avgPrice > 0 ? `$${(s.avgPrice / 1000).toFixed(0)}k` : "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                        <p className="text-sm font-semibold">{s.totalPrice > 0 ? `$${(s.totalPrice / 1000).toFixed(0)}k` : "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientZonalReports;
