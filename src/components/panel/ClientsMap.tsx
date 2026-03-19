import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Package } from "lucide-react";
import { getClientCoordinates } from "@/lib/argentinaCoordinates";
import { getStatusInfo } from "./clientConstants";

interface ClientRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  product_interest: string | null;
  price: number | null;
  province: string | null;
  city: string | null;
  status: string;
  created_at: string;
  created_by: string;
}

interface ClientsMapProps {
  clients: ClientRow[];
  vendedorNames?: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
  activo: "#16a34a",
  en_seguimiento: "#f59e0b",
  negociacion: "#3b82f6",
  cerrado: "#a855f7",
  inactivo: "#9ca3af",
};

function getMarkerColor(status: string): string {
  return STATUS_COLORS[status] || "#9ca3af";
}

function createCircleIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 2.5px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

const ClientsMap = ({ clients, vendedorNames }: ClientsMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);

  // Compute markers data
  const markersData = useMemo(() => {
    return clients
      .map((c) => {
        const coords = getClientCoordinates(c.city, c.province);
        if (!coords) return null;
        // Add slight jitter so same-city markers don't stack exactly
        const jitter = () => (Math.random() - 0.5) * 0.01;
        return {
          client: c,
          lat: coords[0] + jitter(),
          lng: coords[1] + jitter(),
        };
      })
      .filter(Boolean) as { client: ClientRow; lat: number; lng: number }[];
  }, [clients]);

  // Summary KPIs
  const totalVisible = clients.length;
  const provincesCount = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => { if (c.province) set.add(c.province); });
    return set.size;
  }, [clients]);
  const withProduct = useMemo(
    () => clients.filter((c) => c.product_interest).length,
    [clients]
  );

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-38.5, -63.5],
      zoom: 4,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old cluster group
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (clusterObj: any) => {
        const count = clusterObj.getChildCount();
        let size = "small";
        let px = 36;
        if (count >= 10) { size = "medium"; px = 44; }
        if (count >= 50) { size = "large"; px = 52; }
        return L.divIcon({
          html: `<div style="
            display:flex; align-items:center; justify-content:center;
            width:${px}px; height:${px}px;
            background: hsl(142,76%,36%);
            color: white;
            border-radius: 50%;
            font-weight: 700;
            font-size: ${size === "large" ? 14 : 12}px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: "",
          iconSize: [px, px],
          iconAnchor: [px / 2, px / 2],
        });
      },
    });

    markersData.forEach(({ client, lat, lng }) => {
      const color = getMarkerColor(client.status);
      const statusInfo = getStatusInfo(client.status);
      const vendedor = vendedorNames && client.created_by ? vendedorNames[client.created_by] : null;

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 180px; font-size: 13px; line-height: 1.5;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #1a1a1a;">${client.full_name}</div>
          <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ${color}22; color: ${color}; border: 1px solid ${color}44; margin-bottom: 6px;">
            ${statusInfo.label}
          </div>
          ${client.product_interest ? `<div style="color: #555; font-size: 12px;">📦 ${client.product_interest}</div>` : ""}
          ${client.city || client.province ? `<div style="color: #555; font-size: 12px;">📍 ${[client.city, client.province].filter(Boolean).join(", ")}</div>` : ""}
          ${vendedor ? `<div style="color: #555; font-size: 12px;">👤 ${vendedor}</div>` : ""}
          ${client.price ? `<div style="color: #555; font-size: 12px;">💰 $${Number(client.price).toLocaleString("es-AR")}</div>` : ""}
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: createCircleIcon(color) });
      marker.bindPopup(popupContent, { maxWidth: 260 });
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    // Fit bounds if we have markers
    if (markersData.length > 0) {
      const bounds = L.latLngBounds(markersData.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [markersData, vendedorNames]);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Mapa de Clientes
          </CardTitle>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {Object.entries(STATUS_COLORS).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1">
                <span
                  style={{ background: color, width: 10, height: 10, borderRadius: "50%", display: "inline-block", border: "1.5px solid white", boxShadow: "0 0 2px rgba(0,0,0,0.2)" }}
                />
                {getStatusInfo(key).label}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        {/* Quick KPIs above the map */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">Clientes visibles</p>
              <p className="text-sm font-bold">{totalVisible}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">Provincias</p>
              <p className="text-sm font-bold">{provincesCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <Package className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">Con producto</p>
              <p className="text-sm font-bold">{withProduct}</p>
            </div>
          </div>
        </div>

        {/* Map container */}
        <div
          ref={mapContainerRef}
          className="w-full rounded-lg border overflow-hidden"
          style={{ height: 520 }}
        />

        {markersData.length === 0 && clients.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            No se pudieron geocodificar los clientes. Completá los datos de provincia/ciudad.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientsMap;
