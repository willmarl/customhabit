import { HTTPError } from "ky";
import { kyClient } from "@/lib/kyClient";
import type {
  CasinoSettingsUpdate,
  CasinoState,
} from "./types";

export const fetchCasinoState = () =>
  kyClient.get("casino/state").json<CasinoState>();

export const drawToken = (playId: number) =>
  kyClient.post("casino/draw", { json: { play_id: playId } }).json<CasinoState>();

export const cashIn = (playId: number, tokenIds: number[]) =>
  kyClient
    .post("casino/cash-in", { json: { play_id: playId, token_ids: tokenIds } })
    .json<CasinoState>();

export const spinWheel = (playId: number) =>
  kyClient.post("casino/spin", { json: { play_id: playId } }).json<CasinoState>();

export const spinBonus = (playId: number) =>
  kyClient
    .post("casino/bonus/spin", { json: { play_id: playId } })
    .json<CasinoState>();

export const completeBonus = (playId: number) =>
  kyClient
    .post("casino/bonus/complete", { json: { play_id: playId } })
    .json<CasinoState>();

export const updateCasinoSettings = (data: CasinoSettingsUpdate) =>
  kyClient.patch("casino/settings", { json: data }).json<CasinoState>();

export async function errorMessage(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const body = (await err.response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") return body.detail;
    } catch {
      return err.message;
    }
  }
  return "Something went wrong.";
}
