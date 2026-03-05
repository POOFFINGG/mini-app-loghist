import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken, clearTokens, getProfile, type UserPublic } from "./api";

interface AuthState {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserPublic | null) => void;
  signOut: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  signOut: () => {},
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        signOut,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
