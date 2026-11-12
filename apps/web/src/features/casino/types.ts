export type CasinoToken = {
  id: number;
  color: string;
  habit_id: number;
  habit_name: string;
  earned_on: string;
  source: string;
  created_at: string;
};

export type CasinoPlay = {
  id: number;
  habit_id: number;
  habit_name: string;
  duration_minutes: number;
  earned_on: string;
  phase: "awaiting_draw" | "drawn" | "bonus" | "done" | string;
  origin: string;
  unlocked_tier: number;
  cashed_in: boolean;
  wheel_result: string | null;
  slice_index: number | null;
  reward_text: string | null;
  near_miss: boolean;
  bonus_segment: string | null;
  bonus_deadline: string | null;
  bonus_minutes: number | null;
  bonus_spins_left: number;
  token_id: number | null;
  token_color: string | null;
  forfeited: boolean;
};

export type CasinoSettings = {
  tier1_reward: string;
  tier2_reward: string;
  tier3_reward: string;
  jackpot_reward: string;
  prize_mini_name: string;
  prize_mini_tokens: number;
  prize_mid_name: string;
  prize_mid_tokens: number;
  prize_moon_name: string;
  prize_moon_tokens: number;
};

export type CasinoEvent = {
  kind: "draw" | "cash_in" | "spin" | "bonus_spin" | "bonus_complete" | string;
  play_id: number;
  token_id?: number | null;
  color?: string | null;
  slice_index?: number | null;
  wheel_result?: string | null;
  reward_text?: string | null;
  near_miss?: boolean;
  unlocked_tier?: number | null;
  bonus_segment?: string | null;
  bonus_minutes?: number | null;
  phase?: string | null;
};

export type CasinoState = {
  tokens: CasinoToken[];
  plays: CasinoPlay[];
  settings: CasinoSettings;
  pending_count: number;
  server_now: string;
  event: CasinoEvent | null;
};

export type CasinoSettingsUpdate = Partial<CasinoSettings>;
