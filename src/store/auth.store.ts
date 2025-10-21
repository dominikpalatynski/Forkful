import { create } from "zustand";
import type { UserDto } from "@/types";

interface AuthState {
  user: UserDto | null;
}

interface AuthActions {
  setUser: (user: UserDto | null) => void;
  clearUser: () => void;
}

type AuthStore = AuthState & AuthActions;

const getDefaultState = (): AuthState => ({
  user: null,
});

export const useAuthStore = create<AuthStore>()((set) => ({
  ...getDefaultState(),

  setUser: (user) => set({ user }),

  clearUser: () => set(getDefaultState()),
}));
