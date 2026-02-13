import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Download, MapPin, BarChart3, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { exportToCSV } from "@/lib/exportCsv";
import { ARGENTINA_PROVINCES } from "@/lib/argentinaProvinces";
import { toast } from "sonner";

const COLORS = ["hsl(142,76%,36%)", "hsl(142,76%,46%)", "hsl(142,60%,56%)", "hsl(200,70%,50%)", "hsl(40,90%,50%)", "hsl(0,70%,50%)", "hsl(270,60%,50%)", "hsl(180,60%,40%)"];

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  approved: "Aprobada",
  rejected: "Rechazada",
  completed: "Completado",
  cancelled: "Cancelado",
};

const ZonalReports = () => {
  const [filterProvince, setFilterProvince] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

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
        conversion: stats.total > 0 ? ((stats.sales / stats.total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

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
        conversion: stats.total > 0 ? ((stats.sales / stats.total) * 100).toFixed(1) : "0",
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
      conversion: s.conversion + "%",
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

  const withProvince = filtered.filter((q) => q.province);
  const coveragePercent = filtered.length > 0 ? ((withProvince.length / filtered.length) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filterProvince} onValueChange={setFilterProvince}>
              <SelectTrigger><SelectValue placeholder="Provincia" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las provincias</SelectItem>
                {ARGENTINA_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} placeholder="Desde" />
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} placeholder="Hasta" />
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total cotizaciones</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Ventas (aprobadas/completadas)</p>
            <p className="text-2xl font-bold">{filtered.filter((q) => q.status === "completed" || q.status === "approved").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total $</p>
            <p className="text-2xl font-bold">
              ${filtered
                .filter((q) => q.status === "completed" || q.status === "approved")
                .reduce((sum, q) => sum + (Number(q.price) || 0), 0)
                .toLocaleString("es-AR")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Cobertura geográfica</p>
            <p className="text-2xl font-bold">{coveragePercent}%</p>
            <p className="text-[10px] text-muted-foreground">{withProvince.length}/{filtered.length} con provincia</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Cotizaciones por Provincia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {provinceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={provinceStats.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="province" width={75} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: number) => [val, "Cotizaciones"]} />
                  <Bar dataKey="total" fill="hsl(142,76%,36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos con provincia</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Distribución por Provincia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {provinceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={provinceStats.slice(0, 8)}
                    dataKey="total"
                    nameKey="province"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ province, percent }) => `${province} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {provinceStats.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos con provincia</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Province table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base">Resumen por Provincia</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportSummary}>
              <Download className="h-4 w-4 mr-1.5" /> CSV Resumen
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportDetail}>
              <Download className="h-4 w-4 mr-1.5" /> CSV Detalle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {provinceStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provincia</TableHead>
                    <TableHead className="text-right">Cotizaciones</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Conversión</TableHead>
                    <TableHead className="text-right">Total $</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provinceStats.map((s) => (
                    <TableRow key={s.province}>
                      <TableCell className="font-medium">{s.province}</TableCell>
                      <TableCell className="text-right">{s.total}</TableCell>
                      <TableCell className="text-right">{s.sales}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={Number(s.conversion) > 50 ? "default" : "secondary"}>
                          {s.conversion}%
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
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* City table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por Ciudad</CardTitle>
        </CardHeader>
        <CardContent>
          {cityStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead className="text-right">Cotizaciones</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Conversión</TableHead>
                    <TableHead className="text-right">Total $</TableHead>
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
                        <Badge variant={Number(s.conversion) > 50 ? "default" : "secondary"}>
                          {s.conversion}%
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
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ZonalReports;
