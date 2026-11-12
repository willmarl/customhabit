import { Link, NavLink } from "react-router-dom";
import { IconTooltipWrap } from "@/components/ui/icon-tooltip";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useCasinoState } from "@/features/casino/hooks";

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
          <CasinoLink />
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

function CasinoLink() {
  const { data } = useCasinoState();
  const count = data?.pending_count ?? 0;
  return (
    <NavLink
      to="/casino"
      className={({ isActive }) =>
        `text-sm font-medium ${
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`
      }
    >
      Casino
      {count > 0 ? (
        <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-amber-950">
          {count}
        </span>
      ) : null}
    </NavLink>
  );
}
