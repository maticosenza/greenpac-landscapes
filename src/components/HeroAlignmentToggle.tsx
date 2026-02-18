import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useEditMode } from "@/hooks/useEditMode";

interface Props {
  alignKey: string;
  defaultAlign?: string;
}

const HeroAlignmentToggle = ({ alignKey, defaultAlign = "left" }: Props) => {
  const { getText, updateText } = useSiteContent();
  const { isEditMode } = useEditMode();

  const current = getText(alignKey, defaultAlign);

  if (!isEditMode) return null;

  return (
    <ToggleGroup
      type="single"
      value={current}
      onValueChange={(val) => {
        if (val) updateText.mutate({ key: alignKey, value: val, contentType: "text" });
      }}
      className="bg-background/80 backdrop-blur-sm rounded-md p-0.5 shadow-md border border-border/50"
    >
      <ToggleGroupItem value="left" aria-label="Alinear izquierda" className="h-7 w-7 p-0">
        <AlignLeft className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centrar" className="h-7 w-7 p-0">
        <AlignCenter className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinear derecha" className="h-7 w-7 p-0">
        <AlignRight className="h-3.5 w-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default HeroAlignmentToggle;
