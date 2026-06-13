import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  university: string;
  gender: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-hydration
  useEffect(() => {
    async function hydrate() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const res = await api.get<User>("/auth/me");
          setUser(res.data);
        }
      } catch (err) {
        console.error("Auto-hydration failed:", err);
        // Clear token if token is invalid or request fails
        await AsyncStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    hydrate();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post<{ user: User; token: string }>("/auth/login", {
        username,
        password,
      });
      const { user: loggedInUser, token } = res.data;
      await AsyncStorage.setItem("token", token);
      setUser(loggedInUser);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const res = await api.post<{ user: User; token: string }>("/auth/register", userData);
      const { user: registeredUser, token } = res.data;
      await AsyncStorage.setItem("token", token);
      setUser(registeredUser);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout").catch((err) => {
        console.warn("Logout endpoint failed, clearing credentials locally", err);
      });
    } finally {
      await AsyncStorage.removeItem("token");
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
