import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, LoginData, ApiResponse } from "../types";
import api from "../services/api";
import { API_ENDPOINTS } from "../data/endpoints";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage or session for init
    const token = localStorage.getItem("inv_token");
    const storedUser = localStorage.getItem("inv_user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Set token for api instance (though interceptor handles it, this is good for immediate consistency if needed)
      // actually interceptor handles it dynamically from localStorage, so no need to set defaults here
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Real API call
      const response = await api.post<ApiResponse<LoginData>>(API_ENDPOINTS.LOGIN, { email, password });
      const { access_token, user } = response.data.data;

      setUser(user);
      localStorage.setItem("inv_token", access_token);
      localStorage.setItem("inv_user", JSON.stringify(user));
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.LOGOUT); // Attempt to invalidate on server
    } catch (error) {
      // Ignore logout errors (e.g. if token already expired)
      console.warn('Logout API call failed', error);
    }
    setUser(null);
    localStorage.removeItem("inv_user");
    localStorage.removeItem("inv_token");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
