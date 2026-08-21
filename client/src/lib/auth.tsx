import { createContext, useContext } from "react";
import type { User } from "./api";

export type AuthState = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
