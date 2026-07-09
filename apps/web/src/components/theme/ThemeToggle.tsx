import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <IconTooltipButton
        variant="outline"
        size="icon-sm"
        className="border-border/70 bg-background"
        tooltip="Toggle theme"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="size-3.5 opacity-0" />
      </IconTooltipButton>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <IconTooltipButton
      variant="outline"
      size="icon-sm"
      className="border-border/70 bg-background text-muted-foreground"
      tooltip={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </IconTooltipButton>
  );
}
