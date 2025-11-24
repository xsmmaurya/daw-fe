// src/store/riderStore.ts
import { create } from "zustand";

export type RiderRide = {
  id: string;
  status: string;
  pickup_address?: string | null;
  dest_address?: string | null;
};

type RiderState = {
  currentRide: RiderRide | null;
  setRide: (ride: RiderRide | null) => void;
  updateStatus: (status: string) => void;
};

export const useRiderStore = create<RiderState>((set) => ({
  currentRide: null,
  setRide: (ride) => set({ currentRide: ride }),
  updateStatus: (status) =>
    set((state) =>
      state.currentRide ? { currentRide: { ...state.currentRide, status } } : state
    ),
}));
