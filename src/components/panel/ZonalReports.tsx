import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Download, MapPin, BarChart3, Filter, X, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { exportToCSV } from "@/lib/exportCsv";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const COLORS = ["hsl(142,76%,36%)", "hsl(142,76%,46%)", "hsl(142,60%,56%)", "hsl(200,70%,50%)", "hsl(40,90%,50%)", "hsl(0,70%,50%)", "hsl(270,60%,50%)", "hsl(180,60%,40%)"];

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

  const cityStats = useMemo(() => {
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
    return Array.from(map.entries())
      .map(([city, stats]) => ({
        city,
        ...stats,
        conversion: stats.total > 0 ? ((stats.sales / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Buenos Aires cities chart data
  const buenosAiresCityStats = useMemo(() => {
    const map = new Map<string, { total: number; sales: number; totalPrice: number }>();
    filtered
      .filter((q) => q.province === "Buenos Aires")
      .forEach((q) => {
        const city = q.city || "Sin ciudad";
        const entry = map.get(city) || { total: 0, sales: 0, totalPrice: 0 };
        entry.total++;
        if (q.status === "completed" || q.status === "approved") {
          entry.sales++;
          entry.totalPrice += Number(q.price) || 0;
        }
        map.set(city, entry);
      });
    return Array.from(map.entries())
      .map(([city, stats]) => ({
        city,
        ...stats,
        conversion: stats.total > 0 ? ((stats.sales / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

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
              Hay cotizaciones sin provincia/ciudad. Completá estos campos para ver métricas zonales reales.
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

        {/* Charts Row 1: Province bar + pie */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Cotizaciones por Provincia
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              {provinceStats.length > 0 ? (
                <div className="w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart data={provinceStats.slice(0, 10)} layout="vertical" margin={{ left: isMobile ? 0 : 10, right: 16, top: 5, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="province" width={isMobile ? 80 : 100} tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <RechartsTooltip
                        formatter={(val: number) => [val, "Cotizaciones"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="total" fill="hsl(142,76%,36%)" radius={[0, 4, 4, 0]} />
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
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Distribución por Provincia
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              {provinceStats.length > 0 ? (
                <div className="w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={pieChartHeight}>
                    <PieChart>
                      <Pie
                        data={provinceStats.slice(0, 8)}
                        dataKey="total"
                        nameKey="province"
                        cx="50%"
                        cy={isMobile ? "42%" : "45%"}
                        outerRadius={isMobile ? 65 : 95}
                        innerRadius={isMobile ? 20 : 30}
                        label={isMobile ? false : ({ province, percent }) => `${province} ${(percent * 100).toFixed(0)}%`}
                        labelLine={!isMobile}
                      >
                        {provinceStats.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: number, _name: string, props: any) => [val, props.payload.province]}
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

        {/* Chart Row 2: Buenos Aires cities */}
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Cotizaciones por Ciudad (Buenos Aires)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            {buenosAiresCityStats.length > 0 ? (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={buenosAiresCityStats.slice(0, 12)} layout="vertical" margin={{ left: isMobile ? 0 : 10, right: 16, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="city" width={isMobile ? 80 : 110} tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip
                      formatter={(val: number) => [val, "Cotizaciones"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="total" fill="hsl(200,70%,50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin datos de ciudades en Buenos Aires. Agregá provincia y ciudad a las cotizaciones.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={handleExportSummary} className="gap-1.5">
                <Download className="h-4 w-4" /> CSV Resumen
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar resumen por provincia</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={handleExportDetail} className="gap-1.5">
                <Download className="h-4 w-4" /> CSV Detalle
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar detalle con todas las cotizaciones</TooltipContent>
          </Tooltip>
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
            {cityStats.length > 0 ? (
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
                      {cityStats.slice(0, 20).map((s) => (
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
                  {cityStats.slice(0, 20).map((s) => (
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
