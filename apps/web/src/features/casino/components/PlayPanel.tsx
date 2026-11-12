import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { errorMessage } from "../api";
import { tokenColor } from "../colors";
import { formatGoldChance } from "../gold";
import {
  useCashIn,
  useCasinoState,
  useCompleteBonus,
  useDrawToken,
  useSpinBonus,
  useSpinWheel,
} from "../hooks";
import type { CasinoEvent, CasinoPlay, CasinoToken } from "../types";
import { BONUS_SLICES, mainWheelSlices } from "../wheel";
import RewardWheel from "./RewardWheel";

type Offer = { tier: number; ids: number[]; label: string };

function cashOffers(tokens: CasinoToken[]): Offer[] {
  const groups = new Map<string, CasinoToken[]>();
  for (const token of tokens) {
    const list = groups.get(token.color) ?? [];
    list.push(token);
    groups.set(token.color, list);
  }
  const offers: Offer[] = [];
  for (const [color, group] of groups) {
    if (color === "gold" && group.length >= 1) {
      offers.push({
        tier: 3,
        ids: [group[0].id],
        label: "Spend 1 gold for Tier 3",
      });
      continue;
    }
    if (group.length >= 3) {
      offers.push({
        tier: 3,
        ids: group.slice(0, 3).map((token) => token.id),
        label: `Spend 3 ${color} for Tier 3`,
      });
    }
    if (group.length >= 2) {
      offers.push({
        tier: 2,
        ids: group.slice(0, 2).map((token) => token.id),
        label: `Spend 2 ${color} for Tier 2`,
      });
    }
  }
  return offers;
}

function describe(event: CasinoEvent): string {
  if (event.kind === "draw") return `Drew a ${event.color} token.`;
  if (event.kind === "cash_in") return `Tier ${event.unlocked_tier} is unlocked for this spin.`;
  if (event.kind === "spin") {
    if (event.wheel_result === "JACKPOT") return `Jackpot. ${event.reward_text}`;
    if (event.wheel_result === "BONUS") {
      return `Bonus. Collected ${event.reward_text}. The bonus wheel is next.`;
    }
    if (event.near_miss) {
      const landed = event.wheel_result?.replace("T", "Tier ") ?? "a higher tier";
      return `Landed on ${landed}. You collected ${event.reward_text}.`;
    }
    return event.reward_text ?? "Tier 1";
  }
  if (event.kind === "bonus_spin") {
    if (event.bonus_segment === "FREE") {
      return `Free ${event.color} token. No extra work.`;
    }
    if (event.bonus_segment === "EXTRA") return "Extra. Two more bonus spins.";
    return `Do ${event.bonus_minutes} more minutes in the next 10:00.`;
  }
  if (event.kind === "bonus_complete") {
    return `Extra ${event.color} token. Spin the main wheel again.`;
  }
  return "";
}

function formatRemain(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type PlayPanelProps = {
  onDrop: (tokenId: number | null) => void;
};

export default function PlayPanel({ onDrop }: PlayPanelProps) {
  const { data, isLoading, isError, refetch } = useCasinoState();
  const draw = useDrawToken();
  const cash = useCashIn();
  const spin = useSpinWheel();
  const bonus = useSpinBonus();
  const complete = useCompleteBonus();
  const mainSlices = useMemo(() => mainWheelSlices(), []);
  const [reveal, setReveal] = useState<CasinoEvent | null>(null);
  const [settled, setSettled] = useState(true);
  const [mainSpinToken, setMainSpinToken] = useState(0);
  const [bonusSpinToken, setBonusSpinToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const finishGuard = useRef<number | null>(null);
  const celebrated = useRef<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!settled || reveal?.kind !== "spin") return;
    const win =
      reveal.wheel_result === "JACKPOT" ||
      (reveal.wheel_result === "T3" && !reveal.near_miss);
    if (!win) return;
    const key = `${reveal.play_id}:${reveal.slice_index}`;
    if (celebrated.current === key) return;
    celebrated.current = key;
    confetti({ particleCount: 90, spread: 65, origin: { y: 0.65 } });
  }, [settled, reveal]);

  const play: CasinoPlay | undefined = data?.plays[0];
  const busy =
    !settled ||
    draw.isPending ||
    cash.isPending ||
    spin.isPending ||
    bonus.isPending ||
    complete.isPending;

  const showBonusWheel =
    (reveal?.kind === "bonus_spin" && !settled) ||
    (!!play &&
      play.phase === "bonus" &&
      (play.bonus_spins_left > 0 || play.bonus_deadline != null));

  const bonusIndex = BONUS_SLICES.findIndex(
    (slice) => slice.id === reveal?.bonus_segment,
  );

  const noteToken = (event: CasinoEvent | null) => {
    if (event?.token_id) onDrop(event.token_id);
  };

  const fail = async (err: unknown) => {
    setSettled(true);
    setError(await errorMessage(err));
  };

  const remain =
    play?.bonus_deadline != null
      ? new Date(play.bonus_deadline).getTime() - now
      : null;

  useEffect(() => {
    if (!play || play.phase !== "bonus" || remain == null || remain > 0) return;
    if (finishGuard.current === play.id) return;
    finishGuard.current = play.id;
    complete.mutate(play.id, {
      onError: async (err) => {
        setError(await errorMessage(err));
        void refetch();
      },
    });
  }, [play, remain, complete, refetch]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading the wheel…</p>;
  }
  if (isError || !data) {
    return <p className="text-sm text-destructive">The casino could not load.</p>;
  }

  const offers = cashOffers(data.tokens);

  return (
    <section className="space-y-4">
      <RewardWheel
        key={showBonusWheel ? "bonus" : "main"}
        slices={showBonusWheel ? BONUS_SLICES : mainSlices}
        landIndex={
          showBonusWheel
            ? bonusIndex >= 0
              ? bonusIndex
              : null
            : reveal?.kind === "spin"
              ? (reveal.slice_index ?? null)
              : null
        }
        spinToken={showBonusWheel ? bonusSpinToken : mainSpinToken}
        onRest={() => setSettled(true)}
      />
      <p className="text-center text-xs text-muted-foreground">
        {showBonusWheel
          ? "Bonus wheel · bigger slice, more likely"
          : "Main wheel · T1 40 · T2 30 · T3 20 · Bonus 8 · Jackpot 2"}
      </p>

      {reveal && settled ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">{describe(reveal)}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!play ? (
        <p className="text-sm text-muted-foreground">
          Mark an opted-in habit done to draw a token. Short and long habits
          both draw one. Longer ones are only more likely to be gold.
        </p>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium">{play.habit_name}</h3>
            <span className="text-xs text-muted-foreground">
              {data.plays.length > 1 ? `1 of ${data.plays.length} · ` : null}
              {formatGoldChance(play.duration_minutes)} gold
            </span>
          </div>

          {play.phase === "awaiting_draw" ? (
            <Button
              disabled={busy}
              onClick={() => {
                setError(null);
                draw.mutate(play.id, {
                  onSuccess: (state) => {
                    setReveal(state.event);
                    noteToken(state.event);
                  },
                  onError: (err) => void fail(err),
                });
              }}
            >
              Draw a token
            </Button>
          ) : null}

          {play.phase === "drawn" ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ background: tokenColor(play.token_color ?? "") }}
                />
                {play.token_color} token in the jar. This spin is Tier{" "}
                {play.unlocked_tier}
                {play.cashed_in ? " (cashed in)" : ""}.
              </p>
              {!play.cashed_in && offers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {offers.map((offer) => (
                    <Button
                      key={offer.label}
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setError(null);
                        cash.mutate(
                          { playId: play.id, tokenIds: offer.ids },
                          {
                            onSuccess: (state) => setReveal(state.event),
                            onError: (err) => void fail(err),
                          },
                        );
                      }}
                    >
                      {offer.label}
                    </Button>
                  ))}
                </div>
              ) : null}
              {!play.cashed_in && offers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No match yet. Spin for Tier 1, or keep tokens for the jar.
                </p>
              ) : null}
              <Button
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setSettled(false);
                  spin.mutate(play.id, {
                    onSuccess: (state) => {
                      setReveal(state.event);
                      setMainSpinToken((value) => value + 1);
                    },
                    onError: (err) => void fail(err),
                  });
                }}
              >
                Spin for Tier {play.unlocked_tier}
              </Button>
            </div>
          ) : null}

          {play.phase === "bonus" && play.bonus_deadline && remain != null && remain > 0 ? (
            <div className="space-y-3">
              <p className="text-sm">
                {play.bonus_minutes} more minutes.{" "}
                <span className="font-medium tabular-nums">{formatRemain(remain)}</span>{" "}
                left. Miss it and the chain stops. The reward you already
                collected stays.
              </p>
              <Button
                disabled={busy}
                onClick={() => {
                  if (finishGuard.current === play.id) return;
                  finishGuard.current = play.id;
                  setError(null);
                  complete.mutate(play.id, {
                    onSuccess: (state) => {
                      setReveal(state.event);
                      noteToken(state.event);
                      finishGuard.current = null;
                    },
                    onError: async (err) => {
                      setError(await errorMessage(err));
                      void refetch();
                    },
                  });
                }}
              >
                I did the extra {play.bonus_minutes} min
              </Button>
            </div>
          ) : null}

          {play.phase === "bonus" && !play.bonus_deadline && play.bonus_spins_left > 0 ? (
            <Button
              disabled={busy}
              onClick={() => {
                setError(null);
                setSettled(false);
                bonus.mutate(play.id, {
                  onSuccess: (state) => {
                    setReveal(state.event);
                    setBonusSpinToken((value) => value + 1);
                    noteToken(state.event);
                  },
                  onError: (err) => void fail(err),
                });
              }}
            >
              Spin the bonus wheel
              {play.bonus_spins_left > 1 ? ` (${play.bonus_spins_left} left)` : ""}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
