"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  ApiError,
  getCurrentUserRequest,
  registerRequest,
  signInRequest
} from "@/lib/api";
import { User } from "@/types";

const AUTH_TOKEN_STORAGE_KEY = "token";
const AUTH_USER_STORAGE_KEY = "authUser";

function isTokenExpired(token: string) {
  try {
    const payloadSegment = token.split(".")[1];

    if (!payloadSegment) {
      return true;
    }

    const normalizedPayload = payloadSegment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload));

    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function readCachedUser(token: string): User | null {
  try {
    const cachedUser = JSON.parse(
      localStorage.getItem(AUTH_USER_STORAGE_KEY) ?? "null"
    );

    if (
      !cachedUser ||
      cachedUser.token !== token ||
      typeof cachedUser.userId !== "string" ||
      typeof cachedUser.username !== "string" ||
      isTokenExpired(token)
    ) {
      return null;
    }

    return cachedUser as User;
  } catch {
    return null;
  }
}

function storeAuthSession(user: User) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, user.token);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

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

    const cachedUser = readCachedUser(token);

    if (cachedUser) {
      setUser(cachedUser);
    }

    let cancelled = false;

    getCurrentUserRequest(token)
      .then((currentUser) => {
        const tokenIsCurrent =
          localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) === token;

        if (!cancelled && tokenIsCurrent) {
          const restoredUser = { ...currentUser, token };
          storeAuthSession(restoredUser);
          setUser(restoredUser);
        }
      })
      .catch((caughtError) => {
        const tokenIsCurrent =
          localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) === token;

        if (
          !cancelled &&
          tokenIsCurrent &&
          caughtError instanceof ApiError &&
          caughtError.status === 401
        ) {
          clearAuthSession();
          setUser(null);
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
    storeAuthSession(signedInUser);
    setUser(signedInUser);
    setIsInitializing(false);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const signedInUser = await signInRequest(username, password);
    storeAuthSession(signedInUser);
    setUser(signedInUser);
    setIsInitializing(false);
  }, []);

  const signOut = useCallback(() => {
    clearAuthSession();
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
