import { useCallback, useState } from "react";

const STORAGE_KEY = "loopModeUiEnabled";

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStored(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // ignore quota / private mode
  }
}

export function useLoopModeUi() {
  const [enabled, setEnabledState] = useState(readStored);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    writeStored(next);
  }, []);

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev;
      writeStored(next);
      return next;
    });
  }, []);

  return { enabled, setEnabled, toggle };
}
