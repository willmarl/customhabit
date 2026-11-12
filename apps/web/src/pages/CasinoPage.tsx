import { useState } from "react";
import PlayPanel from "@/features/casino/components/PlayPanel";
import PrizeSettings from "@/features/casino/components/PrizeSettings";
import TokenJar from "@/features/casino/components/TokenJar";
import { useCasinoState } from "@/features/casino/hooks";

export default function CasinoPage() {
  const { data, isLoading, isError } = useCasinoState();
  const [dropId, setDropId] = useState<number | null>(null);

  if (isLoading) {
    return <p className="px-6 py-8 text-sm text-muted-foreground">Loading casino…</p>;
  }
  if (isError || !data) {
    return (
      <p className="px-6 py-8 text-sm text-destructive">
        Failed to load the casino. Is the API running?
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 text-left">
      <h2 className="mb-1 text-base font-semibold tracking-tight">Casino</h2>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Finish an opted-in habit, draw one token, optionally spend a match for
        a higher tier, then spin. The reward should be something you crave,
        something you tend to overdo, and something you only take from a spin.
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <PlayPanel onDrop={setDropId} />
        <div className="space-y-4">
          <TokenJar tokens={data.tokens} dropId={dropId} settings={data.settings} />
          <PrizeSettings settings={data.settings} />
        </div>
      </div>
    </div>
  );
}
