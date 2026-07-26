"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { getCurrentUserRequest, registerRequest, signInRequest } from "@/lib/api";
import { User } from "@/types";

const AUTH_TOKEN_STORAGE_KEY = "token";

type AuthContextValue = {
  user: User | null;
  isInitializing: boolean;
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
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (!token) {
      setIsInitializing(false);
      return;
    }

    let cancelled = false;

    getCurrentUserRequest(token)
      .then((currentUser) => {
        const tokenIsCurrent =
          localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) === token;

        if (!cancelled && tokenIsCurrent) {
          setUser({ ...currentUser, token });
        }
      })
      .catch(() => {
        if (localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) === token) {
          localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsInitializing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const signedInUser = await registerRequest(username, password);
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, signedInUser.token);
    setUser(signedInUser);
    setIsInitializing(false);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const signedInUser = await signInRequest(username, password);
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, signedInUser.token);
    setUser(signedInUser);
    setIsInitializing(false);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      register,
      signIn,
      signOut
    }),
    [isInitializing, register, signIn, signOut, user]
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
