import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSettings } from "./api";
import type { AppSettingsUpdate } from "@/features/habits/types";

const SETTINGS_KEY = ["settings"];

export const useSettings = () =>
  useQuery({ queryKey: SETTINGS_KEY, queryFn: fetchSettings });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppSettingsUpdate) => updateSettings(data),
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_KEY, settings);
      queryClient.invalidateQueries({ queryKey: ["habits", "board"] });
    },
  });
};
