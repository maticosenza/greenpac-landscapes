import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Package, Loader2 } from "lucide-react";
import { getStatusInfo } from "./clientConstants";
import { geocodeClients } from "@/lib/nominatimGeocoder";
import ClientsMapSearch from "./ClientsMapSearch";

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
  created_by?: string;
  lat?: number | null;
  lng?: number | null;
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
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [geocoding, setGeocoding] = useState(false);
  const [coordsMap, setCoordsMap] = useState<Map<string, [number, number]>>(new Map());

  // Use stored lat/lng when available, geocode only those without
  useEffect(() => {
    if (clients.length === 0) {
      setCoordsMap(new Map());
      return;
    }
    let cancelled = false;

    // Clients that already have stored coordinates
    const withCoords = new Map<string, [number, number]>();
    const needsGeocoding: { id: string; city: string | null; province: string | null }[] = [];

    clients.forEach((c) => {
      if (c.lat && c.lng) {
        withCoords.set(c.id, [c.lat, c.lng]);
      } else if (c.city || c.province) {
        needsGeocoding.push({ id: c.id, city: c.city, province: c.province });
      }
    });

    if (needsGeocoding.length === 0) {
      setCoordsMap(withCoords);
      return;
    }

    setGeocoding(true);
    geocodeClients(needsGeocoding)
      .then((geocoded) => {
        if (!cancelled) {
          // Merge stored + geocoded
          geocoded.forEach((v, k) => withCoords.set(k, v));
          setCoordsMap(withCoords);
          setGeocoding(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCoordsMap(withCoords);
          setGeocoding(false);
        }
      });
    return () => { cancelled = true; };
  }, [clients]);

  // Compute markers data from geocoded coords
  const markersData = useMemo(() => {
    return clients
      .map((c) => {
        const coords = coordsMap.get(c.id);
        if (!coords) return null;
        const jitter = () => (Math.random() - 0.5) * 0.005;
        return { client: c, lat: coords[0] + jitter(), lng: coords[1] + jitter() };
      })
      .filter(Boolean) as { client: ClientRow; lat: number; lng: number }[];
  }, [clients, coordsMap]);

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
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (clusterRef.current) map.removeLayer(clusterRef.current);
    markersMapRef.current.clear();

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (clusterObj: any) => {
        const count = clusterObj.getChildCount();
        let px = 36;
        let fontSize = 12;
        if (count >= 10) { px = 44; }
        if (count >= 50) { px = 52; fontSize = 14; }
        return L.divIcon({
          html: `<div style="
            display:flex; align-items:center; justify-content:center;
            width:${px}px; height:${px}px;
            background: hsl(142,76%,36%);
            color: white; border-radius: 50%;
            font-weight: 700; font-size: ${fontSize}px;
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
      const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
      const appleUrl = `maps://maps.apple.com/?daddr=${lat},${lng}`;

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px; font-size: 13px; line-height: 1.5;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #1a1a1a;">${client.full_name}</div>
          <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ${color}22; color: ${color}; border: 1px solid ${color}44; margin-bottom: 6px;">
            ${statusInfo.label}
          </div>
          ${client.product_interest ? `<div style="color: #555; font-size: 12px;">📦 ${client.product_interest}</div>` : ""}
          ${client.city || client.province ? `<div style="color: #555; font-size: 12px;">📍 ${[client.city, client.province].filter(Boolean).join(", ")}</div>` : ""}
          ${vendedor ? `<div style="color: #555; font-size: 12px;">👤 ${vendedor}</div>` : ""}
          ${client.price ? `<div style="color: #555; font-size: 12px;">💰 $${Number(client.price).toLocaleString("es-AR")}</div>` : ""}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; gap: 6px; flex-wrap: wrap;">
            <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:#16a34a;color:white;text-decoration:none;cursor:pointer;">Google Maps</a>
            <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:#f3f4f6;color:#1f2937;text-decoration:none;border:1px solid #d1d5db;cursor:pointer;">Waze</a>
            <a href="${appleUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:#f3f4f6;color:#1f2937;text-decoration:none;border:1px solid #d1d5db;cursor:pointer;">Apple Maps</a>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: createCircleIcon(color) });
      marker.bindPopup(popupContent, { maxWidth: 260 });
      cluster.addLayer(marker);
      markersMapRef.current.set(client.id, marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    if (markersData.length > 0) {
      const bounds = L.latLngBounds(markersData.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [markersData, vendedorNames]);

  // Handle search selection — zoom to marker and open popup
  const handleSelectClient = useCallback((clientId: string) => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    const marker = markersMapRef.current.get(clientId);
    if (!map || !marker) return;

    // Zoom to marker and spiderfy cluster if needed
    if (cluster) {
      cluster.zoomToShowLayer(marker, () => {
        marker.openPopup();
      });
    } else {
      map.setView(marker.getLatLng(), 14, { animate: true });
      marker.openPopup();
    }
  }, []);

  return (
    <Card className="relative z-0">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Mapa de Clientes
          </CardTitle>
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
        {/* KPIs + Search */}
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

        <div className="flex justify-end mb-2">
          <ClientsMapSearch clients={clients} onSelect={handleSelectClient} />
        </div>

        {/* Map container */}
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="w-full rounded-lg border overflow-hidden relative z-0"
            style={{ height: 520 }}
          />
          {geocoding && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg z-[500]">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border text-sm font-medium text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Geolocalizando clientes…
              </div>
            </div>
          )}
        </div>

        {!geocoding && markersData.length === 0 && clients.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            No se pudieron geocodificar los clientes. Completá los datos de provincia/ciudad.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientsMap;
