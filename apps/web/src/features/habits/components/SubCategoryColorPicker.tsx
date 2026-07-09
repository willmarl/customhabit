import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { useUpdateGroup } from "../hooks";
import {
  RAINBOW_SWATCH_CLASS,
  SUB_CATEGORY_COLORS,
  getSubCategoryColor,
  isHexColor,
  type SubCategoryColorId,
} from "../lib/subCategoryColors";

type SubCategoryColorPickerProps = {
  groupId: number;
  color: string;
};

export default function SubCategoryColorPicker({
  groupId,
  color,
}: SubCategoryColorPickerProps) {
  const [open, setOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateGroup } = useUpdateGroup();
  const current = getSubCategoryColor(color);
  const isCustom = isHexColor(color);

  const handleSelect = (next: SubCategoryColorId) => {
    updateGroup({ id: groupId, data: { color: next } });
    setOpen(false);
  };

  const handleCustomChange = (hex: string) => {
    updateGroup({ id: groupId, data: { color: hex } });
    setOpen(false);
  };

  const openCustomPicker = () => {
    colorInputRef.current?.click();
  };

  return (
    <div className="relative">
      <IconTooltipButton
        type="button"
        variant="outline"
        size="icon-sm"
        tooltip="Set color label"
        onClick={() => setOpen((prev) => !prev)}
        className="border-border/70 bg-background"
        aria-label="Set color label"
      >
        <span
          className={cn("size-3 rounded-full", current.swatch)}
          style={current.styles?.swatch}
        />
      </IconTooltipButton>

      <input
        ref={colorInputRef}
        type="color"
        value={isCustom ? color : "#22c55e"}
        className="sr-only"
        onChange={(e) => handleCustomChange(e.target.value)}
        aria-hidden
        tabIndex={-1}
      />

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close color picker"
          />
          <div className="absolute left-0 top-full z-50 mt-1.5 rounded-md border border-border/70 bg-background p-2 shadow-sm">
            <div className="flex gap-1.5">
              {SUB_CATEGORY_COLORS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id as SubCategoryColorId)}
                  className={cn(
                    "size-6 rounded-full border-2 border-transparent transition-transform hover:scale-110",
                    option.swatch,
                    color === option.id && "ring-2 ring-foreground ring-offset-2",
                  )}
                  aria-label={option.label}
                  title={option.label}
                />
              ))}
              <button
                type="button"
                onClick={openCustomPicker}
                className={cn(
                  "size-6 rounded-full border-2 border-white transition-transform hover:scale-110",
                  RAINBOW_SWATCH_CLASS,
                  isCustom && "ring-2 ring-foreground ring-offset-2",
                )}
                aria-label="Custom color"
                title="Custom color"
              />
            </div>
            {isCustom && (
              <p className="mt-2 text-xs text-muted-foreground">
                Custom: {color.toUpperCase()}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
