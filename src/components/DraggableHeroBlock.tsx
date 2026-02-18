import { useRef, useState, useCallback } from "react";
import { Move, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useEditMode } from "@/hooks/useEditMode";

interface Offset {
  x: number;
  y: number;
}

interface Props {
  posKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a hero block so it stays in normal document flow by default.
 * In edit mode the user can click "Mover" to drag it; the offset (px)
 * is persisted via site_content and applied as a CSS translate so
 * elements never overlap in production.
 */
const DraggableHeroBlock = ({ posKey, children, className = "" }: Props) => {
  const { getText, updateText } = useSiteContent();
  const { isEditMode } = useEditMode();

  // Persisted offset in pixels
  const raw = getText(posKey, "");
  let savedOffset: Offset = { x: 0, y: 0 };
  try {
    if (raw) savedOffset = JSON.parse(raw);
  } catch {}

  const [localOffset, setLocalOffset] = useState<Offset | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, startOffset: { x: 0, y: 0 } });
  const ref = useRef<HTMLDivElement>(null);

  const offset = localOffset ?? savedOffset;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isMoving || !ref.current) return;
      e.preventDefault();
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY, startOffset: { ...offset } };
      setIsDragging(true);
      ref.current.setPointerCapture(e.pointerId);
    },
    [isMoving, offset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      setLocalOffset({
        x: dragStartRef.current.startOffset.x + dx,
        y: dragStartRef.current.startOffset.y + dy,
      });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
  }, [isDragging]);

  const handleConfirm = useCallback(() => {
    if (localOffset) {
      updateText.mutate({ key: posKey, value: JSON.stringify(localOffset), contentType: "json" });
    }
    setIsMoving(false);
  }, [localOffset, posKey, updateText]);

  const handleReset = useCallback(() => {
    const zero = { x: 0, y: 0 };
    setLocalOffset(zero);
    setIsMoving(false);
    updateText.mutate({ key: posKey, value: JSON.stringify(zero), contentType: "json" });
  }, [posKey, updateText]);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        touchAction: isMoving ? "none" : "auto",
        transition: isDragging ? "none" : "transform 0.2s ease",
      }}
      className={`${
        isMoving
          ? `cursor-move select-none rounded-lg p-2 ${
              isDragging ? "ring-2 ring-primary scale-[1.02]" : "ring-1 ring-dashed ring-primary/40 hover:ring-2 hover:ring-primary/60"
            }`
          : ""
      } ${className}`}
      onPointerDown={isMoving ? handlePointerDown : undefined}
      onPointerMove={isMoving ? handlePointerMove : undefined}
      onPointerUp={isMoving ? handlePointerUp : undefined}
      onPointerCancel={isMoving ? handlePointerUp : undefined}
    >
      {children}
      {isEditMode && !isDragging && (
        <div className="absolute -top-9 right-0 flex items-center gap-1 z-20">
          {!isMoving ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-[11px] gap-1 px-2 shadow-md"
                onClick={(e) => { e.stopPropagation(); setIsMoving(true); }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Move className="h-3 w-3" />
                Mover
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-[11px] gap-1 px-2 shadow-md"
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="h-7 text-[11px] gap-1 px-3 shadow-md"
              onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Check className="h-3 w-3" />
              Confirmar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableHeroBlock;
