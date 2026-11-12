import { Outlet } from "react-router-dom";
import { useDayActivity } from "@/features/habits/hooks";
import { useTimerFavicon } from "@/features/habits/hooks/useTimerFavicon";
import Header from "./Header";

export default function Layout() {
  const { data: activity } = useDayActivity();
  useTimerFavicon(!!activity?.active_session);

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
