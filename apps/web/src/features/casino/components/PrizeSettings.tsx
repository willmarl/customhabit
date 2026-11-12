import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "../api";
import { useUpdateCasinoSettings } from "../hooks";
import type { CasinoSettings } from "../types";

type PrizeSettingsProps = {
  settings: CasinoSettings;
};

type FormState = CasinoSettings;

export default function PrizeSettings({ settings }: PrizeSettingsProps) {
  const [form, setForm] = useState<FormState>(settings);
  const [error, setError] = useState<string | null>(null);
  const save = useUpdateCasinoSettings();
  const signature = JSON.stringify(settings);
  const [synced, setSynced] = useState(signature);
  if (synced !== signature) {
    setSynced(signature);
    setForm(JSON.parse(signature) as FormState);
  }

  const setText = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setCount = (key: keyof FormState, value: string) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    setForm((prev) => ({ ...prev, [key]: parsed }));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    save.mutate(form, {
      onError: async (err) => setError(await errorMessage(err)),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-medium">Rewards</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Name something you already want. Take it only after a spin. A miss
          above your tier still pays the tier you unlocked.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tier 1" value={form.tier1_reward} onChange={(value) => setText("tier1_reward", value)} />
        <Field label="Tier 2" value={form.tier2_reward} onChange={(value) => setText("tier2_reward", value)} />
        <Field label="Tier 3" value={form.tier3_reward} onChange={(value) => setText("tier3_reward", value)} />
        <Field label="Jackpot" value={form.jackpot_reward} onChange={(value) => setText("jackpot_reward", value)} />
      </div>
      <div>
        <h3 className="text-sm font-medium">Jar lines</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Unspent tokens fill the jar. Spending a match on a spin is the trade.
        </p>
      </div>
      <div className="grid gap-3">
        <Line
          label="Mini"
          name={form.prize_mini_name}
          count={form.prize_mini_tokens}
          onName={(value) => setText("prize_mini_name", value)}
          onCount={(value) => setCount("prize_mini_tokens", value)}
        />
        <Line
          label="Mid"
          name={form.prize_mid_name}
          count={form.prize_mid_tokens}
          onName={(value) => setText("prize_mid_name", value)}
          onCount={(value) => setCount("prize_mid_tokens", value)}
        />
        <Line
          label="Moonshot"
          name={form.prize_moon_name}
          count={form.prize_moon_tokens}
          onName={(value) => setText("prize_moon_name", value)}
          onCount={(value) => setCount("prize_moon_tokens", value)}
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save rewards"}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} maxLength={80} />
    </div>
  );
}

function Line({
  label,
  name,
  count,
  onName,
  onCount,
}: {
  label: string;
  name: string;
  count: number;
  onName: (value: string) => void;
  onCount: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[5rem_1fr_5rem] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input value={name} onChange={(event) => onName(event.target.value)} maxLength={80} placeholder="Prize name" />
      <Input
        type="number"
        min={1}
        value={count}
        onChange={(event) => onCount(event.target.value)}
        className="tabular-nums"
        aria-label={`${label} token count`}
      />
    </div>
  );
}
