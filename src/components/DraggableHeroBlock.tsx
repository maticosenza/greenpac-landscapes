import { useRef, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useEditMode } from "@/hooks/useEditMode";

interface Position {
  xPct: number;
  yPct: number;
}

interface Props {
  posKey: string;
  defaultPos: Position;
  children: React.ReactNode;
  className?: string;
}

const DraggableHeroBlock = ({ posKey, defaultPos, children, className = "" }: Props) => {
  const { getText, updateText } = useSiteContent();
  const { isEditMode } = useEditMode();

  const raw = getText(posKey, "");
  let basePos = defaultPos;
  try {
    if (raw) basePos = JSON.parse(raw);
  } catch {}

  const [localPos, setLocalPos] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPos: defaultPos });
  const ref = useRef<HTMLDivElement>(null);

  const pos = localPos ?? basePos;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isEditMode || !ref.current) return;
      e.preventDefault();
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPos: { ...pos },
      };
      setIsDragging(true);
      ref.current.setPointerCapture(e.pointerId);
    },
    [isEditMode, pos],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !ref.current) return;
      const parent = ref.current.parentElement!.getBoundingClientRect();
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const dxPct = (dx / parent.width) * 100;
      const dyPct = (dy / parent.height) * 100;
      setLocalPos({
        xPct: Math.max(10, Math.min(90, dragStartRef.current.startPos.xPct + dxPct)),
        yPct: Math.max(5, Math.min(95, dragStartRef.current.startPos.yPct + dyPct)),
      });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (localPos) {
      updateText.mutate({
        key: posKey,
        value: JSON.stringify(localPos),
        contentType: "json",
      });
    }
  }, [isDragging, localPos, posKey, updateText]);

  const handleReset = useCallback(() => {
    setLocalPos(null);
    updateText.mutate({
      key: posKey,
      value: JSON.stringify(defaultPos),
      contentType: "json",
    });
  }, [defaultPos, posKey, updateText]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: `${pos.xPct}%`,
        top: `${pos.yPct}%`,
        transform: "translate(-50%, -50%)",
        touchAction: isEditMode ? "none" : "auto",
      }}
      className={`z-10 ${
        isEditMode
          ? `cursor-move select-none rounded-lg p-2 ${
              isDragging
                ? "ring-2 ring-primary scale-[1.02]"
                : "ring-1 ring-dashed ring-primary/40 hover:ring-2 hover:ring-primary/60"
            }`
          : ""
      } ${className}`}
      onPointerDown={isEditMode ? handlePointerDown : undefined}
      onPointerMove={isEditMode ? handlePointerMove : undefined}
      onPointerUp={isEditMode ? handlePointerUp : undefined}
      onPointerCancel={isEditMode ? handlePointerUp : undefined}
    >
      {children}
      {isEditMode && !isDragging && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute -top-8 right-0 h-6 text-[10px] gap-1 px-2 shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      )}
    </div>
  );
};

export default DraggableHeroBlock;
