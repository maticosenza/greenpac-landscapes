import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Locality {
  id: string;
  nombre: string;
  departamento?: { nombre: string };
  centroide?: { lat: number; lon: number };
}

interface LocalityAutocompleteProps {
  province: string;
  value: string;
  onChange: (city: string, postalCode?: string) => void;
  disabled?: boolean;
}

const LocalityAutocomplete = ({ province, value, onChange, disabled }: LocalityAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external value
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch localities when province changes or query changes
  const fetchLocalities = useCallback(async (searchQuery: string) => {
    if (!province || searchQuery.length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(province)}&nombre=${encodeURIComponent(searchQuery)}&max=15&campos=id,nombre,departamento,centroide`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOptions(data.localidades || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [province]);

  const handleInputChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    onChange(text); // Update parent immediately
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchLocalities(text), 300);
  };

  const handleSelect = (loc: Locality) => {
    setQuery(loc.nombre);
    setOpen(false);
    onChange(loc.nombre);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          placeholder={province ? "Escribí para buscar..." : "Seleccioná provincia primero"}
          disabled={disabled || !province}
          maxLength={100}
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && options.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-lg max-h-48 overflow-y-auto">
          {options.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
            >
              <span className="font-medium">{loc.nombre}</span>
              {loc.departamento?.nombre && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({loc.departamento.nombre})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 2 && !loading && options.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Sin resultados
        </div>
      )}
    </div>
  );
};

export default LocalityAutocomplete;
