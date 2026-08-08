import { useCallback, useEffect, useState } from "react";
import {
  startBreakDoneRing,
  stopBreakDoneRing,
  unlockBreakAudio,
} from "../lib/breakDoneSound";

export type BreakUiState =
  | { kind: "idle" }
  | { kind: "offer"; expiresAt: number }
  | { kind: "running"; endsAt: number }
  | { kind: "done" };

const OFFER_MS = 5_000;

export const BREAK_OFFER_MS = OFFER_MS;

export function usePostHabitBreak(breakMinutes: number) {
  const [state, setState] = useState<BreakUiState>({ kind: "idle" });

  const offer = useCallback(() => {
    if (breakMinutes <= 0) return;
    setState((prev) => {
      if (prev.kind === "running") return prev;
      return { kind: "offer", expiresAt: Date.now() + OFFER_MS };
    });
  }, [breakMinutes]);

  const decline = useCallback(() => {
    setState({ kind: "idle" });
  }, []);

  const accept = useCallback(() => {
    if (breakMinutes <= 0) {
      setState({ kind: "idle" });
      return;
    }
    unlockBreakAudio();
    setState({
      kind: "running",
      endsAt: Date.now() + breakMinutes * 60_000,
    });
  }, [breakMinutes]);

  const endEarly = useCallback(() => {
    stopBreakDoneRing();
    setState({ kind: "idle" });
  }, []);

  const dismiss = useCallback(() => {
    stopBreakDoneRing();
    setState({ kind: "idle" });
  }, []);

  // Auto-decline offer after 5s
  useEffect(() => {
    if (state.kind !== "offer") return;
    const expiresAt = state.expiresAt;
    const id = window.setTimeout(() => {
      setState((prev) =>
        prev.kind === "offer" && prev.expiresAt === expiresAt
          ? { kind: "idle" }
          : prev,
      );
    }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [state]);

  // Finish running timer → ring until dismissed
  useEffect(() => {
    if (state.kind !== "running") return;
    const endsAt = state.endsAt;
    const id = window.setTimeout(() => {
      // Timeout is cleared on end-early / unmount, so this only runs on natural finish.
      startBreakDoneRing();
      setState((prev) =>
        prev.kind === "running" && prev.endsAt === endsAt
          ? { kind: "done" }
          : prev,
      );
    }, Math.max(0, endsAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    return () => stopBreakDoneRing();
  }, []);

  return { state, offer, accept, decline, endEarly, dismiss };
}
