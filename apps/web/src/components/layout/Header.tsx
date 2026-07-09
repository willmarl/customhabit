import { Link } from "react-router-dom";

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
        <Link
          to="/settings"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
      </div>
    </header>
  );
}
