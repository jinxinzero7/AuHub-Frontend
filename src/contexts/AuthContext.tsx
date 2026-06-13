"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { JWT_CLAIMS, API_ENDPOINTS } from "@/lib/constants";
import type { User, AuthResponse, LoginRequest, RegisterRequest } from "@/types";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  refreshSession: async () => {},
  logout: () => {},
});

function decodeJwt(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub || payload[JWT_CLAIMS.ID],
      email: payload.email || payload[JWT_CLAIMS.EMAIL],
      phoneNumber: payload.phone_number || payload[JWT_CLAIMS.PHONE_NUMBER] || "",
      nickname: payload.nickname || payload[JWT_CLAIMS.NICKNAME] || "",
      name: payload.name || payload[JWT_CLAIMS.NAME],
      isEmailVerified: (payload.email_verified || payload[JWT_CLAIMS.EMAIL_VERIFIED]) === "true",
      isPhoneVerified: (payload.phone_verified || payload[JWT_CLAIMS.PHONE_VERIFIED]) === "true",
      documentVerificationStatus: payload.document_verification_status || payload[JWT_CLAIMS.DOCUMENT_VERIFICATION_STATUS] || "Unverified",
      role: (payload.role || payload[JWT_CLAIMS.ROLE]) === "Admin" ? 1 : 0,
    };
  } catch (err) {
    console.warn("Failed to decode JWT token:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded) {
          setUser(decoded);
          setAccessToken(token);
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      const decoded = decodeJwt(response.data.accessToken);
      setUser(decoded);
      setAccessToken(response.data.accessToken);
      router.push("/");
    }
  }, [router]);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      const decoded = decodeJwt(response.data.accessToken);
      setUser(decoded);
      setAccessToken(response.data.accessToken);
      router.push("/");
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return;
    }

    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      const decoded = decodeJwt(response.data.accessToken);
      setUser(decoded);
      setAccessToken(response.data.accessToken);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setAccessToken(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
