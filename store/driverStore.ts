// src/store/driverStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AssignmentPayload = {
  ride_id: string;
  status: string;
  pickup?: {
    lat: number;
    lon: number;
    address?: string | null;
  };
  destination?: {
    lat: number;
    lon: number;
    address?: string | null;
  };
};

type DriverState = {
  online: boolean;
  assignments: AssignmentPayload[];
  setOnline: (online: boolean) => void;

  // events
  addAssignment: (a: AssignmentPayload) => void;
  removeAssignment: (rideId: string) => void;
  clearAssignments: () => void;
};

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      online: false,
      assignments: [],

      setOnline: (online) => set({ online }),

      addAssignment: (a) =>
        set((state) => {
          if (state.assignments.some((x) => x.ride_id === a.ride_id)) return state;
          return { assignments: [a, ...state.assignments] };
        }),

      removeAssignment: (rideId) =>
        set((state) => ({
          assignments: state.assignments.filter((x) => x.ride_id !== rideId),
        })),

      clearAssignments: () => set({ assignments: [] }),
    }),
    {
      name: "driver-store", // localStorage key
    }
  )
);
