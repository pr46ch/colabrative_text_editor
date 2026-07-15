"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import { registerRequest, signInRequest } from "@/lib/api";
import { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  register: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const register = useCallback(async (username: string, password: string) => {
    const signedInUser = await registerRequest(username, password);
    setUser(signedInUser);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const signedInUser = await signInRequest(username, password);
    setUser(signedInUser);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      register,
      signIn,
      signOut
    }),
    [register, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
