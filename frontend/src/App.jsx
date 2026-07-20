import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rotina from "./pages/Rotina";
import MundoHoje from "./pages/MundoHoje";
import Diario from "./pages/Diario";
import { Loader2 } from "lucide-react";
import ForgotPassword from "./pages/ForgotPassword";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[var(--c1)]" size={28} />
    </div>
  );
}

function Protected({ children }) {
  const { user, checking } = useAuth();

  if (checking) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function PublicOnly({ children }) {
  const { user, checking } = useAuth();

  if (checking) return <LoadingScreen />;
  if (user) return <Navigate to="/rotina" replace />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/rotina" replace />}
            />

            <Route
              path="/login"
              element={
                <PublicOnly>
                  <Login />
                </PublicOnly>
              }
            />

            <Route
              path="/register"
              element={
                <PublicOnly>
                  <Register />
                </PublicOnly>
              }
            />

            <Route
  path="/forgot-password"
  element={
    <PublicOnly>
      <ForgotPassword />
    </PublicOnly>
  }
/>
            <Route element={<AppShell />}>
              <Route
                path="/rotina"
                element={
                  <Protected>
                    <Rotina />
                  </Protected>
                }
              />

              <Route
                path="/mundo"
                element={
                  <Protected>
                    <MundoHoje />
                  </Protected>
                }
              />

              <Route
                path="/diario"
                element={
                  <Protected>
                    <Diario />
                  </Protected>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;