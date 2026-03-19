import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

interface AddressAutocompleteProps {
  city: string;
  province: string;
  value: string;
  onChange: (address: string, lat: number | null, lng: number | null) => void;
  disabled?: boolean;
}

const AddressAutocomplete = ({ city, province, value, onChange, disabled }: AddressAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (text: string) => {
    if (text.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const parts = [text, city, province, "Argentina"].filter(Boolean);
      const q = parts.join(", ");
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=ar`;
      const res = await fetch(url, { headers: { "User-Agent": "GreenpacCRM/1.0" } });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [city, province]);

  const handleInputChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    onChange(text, null, null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 500);
  };

  const handleSelect = (result: NominatimResult) => {
    // Extract a cleaner address from display_name
    const parts = result.display_name.split(",");
    const shortAddr = parts.slice(0, 3).map(s => s.trim()).join(", ");
    setQuery(shortAddr);
    setOpen(false);
    onChange(shortAddr, parseFloat(result.lat), parseFloat(result.lon));
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (query.length >= 3 && results.length > 0) setOpen(true); }}
          placeholder="Calle y número..."
          disabled={disabled}
          maxLength={200}
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-lg max-h-52 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors border-b last:border-b-0"
            >
              <span className="text-foreground">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 3 && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Sin resultados
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
