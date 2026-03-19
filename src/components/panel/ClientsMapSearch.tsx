import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClientOption {
  id: string;
  full_name: string;
  city: string | null;
  province: string | null;
}

interface ClientsMapSearchProps {
  clients: ClientOption[];
  onSelect: (clientId: string) => void;
}

const ClientsMapSearch = ({ clients, onSelect }: ClientsMapSearchProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered =
    query.length >= 2
      ? clients.filter((c) =>
          c.full_name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)
      : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs z-[1000]">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar cliente..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-8 pr-8 h-9 text-sm bg-white border-border focus-visible:border-[#16a34a] focus-visible:ring-[#16a34a]/20"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute mt-1 w-full bg-white rounded-lg border shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c.id);
                setQuery(c.full_name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex flex-col"
            >
              <span className="font-medium text-foreground">{c.full_name}</span>
              {(c.city || c.province) && (
                <span className="text-xs text-muted-foreground">
                  {[c.city, c.province].filter(Boolean).join(", ")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute mt-1 w-full bg-white rounded-lg border shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Sin resultados
        </div>
      )}
    </div>
  );
};

export default ClientsMapSearch;
