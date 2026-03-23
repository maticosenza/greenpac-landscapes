import { useState, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

const MultiSelectField = ({ options, selected, onChange, placeholder = "Buscar..." }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter(
      (o) => !selected.includes(o.value) && o.label.toLowerCase().includes(q)
    );
  }, [options, selected, search]);

  const selectedOptions = useMemo(
    () => selected.map((v) => options.find((o) => o.value === v)).filter(Boolean) as Option[],
    [options, selected]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value]
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer flex flex-wrap gap-1 items-center",
          open && "ring-2 ring-ring ring-offset-1"
        )}
        onClick={() => setOpen(true)}
      >
        {selectedOptions.length === 0 && (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        {selectedOptions.map((o) => (
          <Badge
            key={o.value}
            variant="secondary"
            className="text-xs gap-1 pr-1"
          >
            {o.label}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.value);
              }}
            />
          </Badge>
        ))}
        <ChevronDown className="h-4 w-4 ml-auto shrink-0 text-muted-foreground" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-8"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-1 pb-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Sin resultados</p>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.value}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent"
                  onClick={() => toggle(o.value)}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectField;
