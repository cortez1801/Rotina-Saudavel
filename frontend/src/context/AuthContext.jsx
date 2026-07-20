import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiErrorDetail } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  

  const [user, setUser] = useState(null); // null = checking, false = anon, obj = logged in
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (_) {
      setUser(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });

console.log("LOGIN RETORNOU:", data);
console.log("COOKIES:", document.cookie);

    localStorage.setItem("token", data.token);
    console.log("TOKEN SALVO:", data.token);
    
setUser(data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
  }
};

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  };

  const logout = async () => {
  console.log("ENTROU NO LOGOUT");
  try {
    const res = await api.post("/auth/logout");
    console.log("LOGOUT BACKEND:", res.data);
  } catch (e) {
    console.log("ERRO LOGOUT:", e);
  }
  setUser(false);
  console.log("USER DEFINIDO COMO FALSE");
};

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
