import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cashIn,
  completeBonus,
  drawToken,
  fetchCasinoState,
  spinBonus,
  spinWheel,
  updateCasinoSettings,
} from "./api";
import type { CasinoSettingsUpdate, CasinoState } from "./types";

export const CASINO_KEY = ["casino", "state"] as const;

function cacheState(queryClient: ReturnType<typeof useQueryClient>, state: CasinoState) {
  queryClient.setQueryData(CASINO_KEY, { ...state, event: null });
}

export const useCasinoState = () =>
  useQuery({
    queryKey: CASINO_KEY,
    queryFn: fetchCasinoState,
    retry: 1,
  });

export const useDrawToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playId: number) => drawToken(playId),
    onSuccess: (state) => cacheState(queryClient, state),
  });
};

export const useCashIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playId, tokenIds }: { playId: number; tokenIds: number[] }) =>
      cashIn(playId, tokenIds),
    onSuccess: (state) => cacheState(queryClient, state),
  });
};

export const useSpinWheel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playId: number) => spinWheel(playId),
    onSuccess: (state) => cacheState(queryClient, state),
  });
};

export const useSpinBonus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playId: number) => spinBonus(playId),
    onSuccess: (state) => cacheState(queryClient, state),
  });
};

export const useCompleteBonus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playId: number) => completeBonus(playId),
    onSuccess: (state) => cacheState(queryClient, state),
  });
};

export const useUpdateCasinoSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CasinoSettingsUpdate) => updateCasinoSettings(data),
    onSuccess: (state) => cacheState(queryClient, state),
  });
};
