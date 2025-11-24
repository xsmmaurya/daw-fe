// src/store/authStore.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  id: string;
  email?: string | null;
  phone_number?: string | null;
  tenant_id?: string | null;
  driver_id?: string | null;
  deleted?: boolean;
  locked?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isDriver: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsDriver: (isDriver: boolean) => void;
  markHydrated: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isDriver: false,
      isHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setIsDriver: (isDriver) => set({ isDriver }),
      markHydrated: () => set({ isHydrated: true }),
      logout: () => {
        set({
          user: null,
          token: null,
          isDriver: false,
        });
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      },
    }),
    {
      name: "ride-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    },
  ),
);
