import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="border-b px-8 py-4">
      <nav className="flex gap-4">
        <Link to="/" className="font-medium hover:underline">
          Home
        </Link>
        <Link to="/todos" className="font-medium hover:underline">
          Todos
        </Link>
        <Link to="/test" className="font-medium hover:underline">
          Test
        </Link>
      </nav>
    </header>
  );
}
