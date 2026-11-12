import { useEffect } from "react";

const IDLE_FAVICON = "/favicon.svg";

/** Sky timer mark — readable at 16px favicon size. */
const RUNNING_FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="8" stroke="#0284c7" stroke-width="2.25"/>
      <path d="M12 9v4l2.5 1.5" stroke="#0284c7" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 2h6" stroke="#0284c7" stroke-width="2.25" stroke-linecap="round"/>
      <path d="M12 2v2.5" stroke="#0284c7" stroke-width="2.25" stroke-linecap="round"/>
    </svg>`.replace(/\s+/g, " ").trim(),
  );

function getIconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"]');
}

/** Swap the tab favicon while a focus timer is running. */
export function useTimerFavicon(running: boolean) {
  useEffect(() => {
    const link = getIconLink();
    if (!link) return;

    link.href = running ? RUNNING_FAVICON : IDLE_FAVICON;

    return () => {
      const current = getIconLink();
      if (current) current.href = IDLE_FAVICON;
    };
  }, [running]);
}
