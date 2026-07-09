import { kyClient } from "@/lib/kyClient";
import type { AppSettings, AppSettingsUpdate } from "@/features/habits/types";

export const fetchSettings = () => kyClient.get("settings").json<AppSettings>();

export const updateSettings = (data: AppSettingsUpdate) =>
  kyClient.patch("settings", { json: data }).json<AppSettings>();
