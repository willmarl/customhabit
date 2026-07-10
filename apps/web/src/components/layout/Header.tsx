import { Link } from "react-router-dom";
import { IconTooltipWrap } from "@/components/ui/icon-tooltip";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-border/60 px-6 py-5">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-foreground hover:opacity-80"
        >
          Custom Habit
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/stats"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Stats
          </Link>
          <Link
            to="/snapshots"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Snapshots
          </Link>
          <ThemeToggle />
          <IconTooltipWrap tooltip="Settings">
            <Link
              to="/settings"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Settings
            </Link>
          </IconTooltipWrap>
        </div>
      </div>
    </header>
  );
}
