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
    <div className="App">
      <BrowserRouter>
        <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route element={<Protected><AppShell /></Protected>}>
              <Route path="/" element={<Navigate to="/rotina" replace />} />
              <Route path="/rotina" element={<Rotina />} />
              <Route path="/mundo"  element={<MundoHoje />} />
              <Route path="/diario" element={<Diario />} />
            </Route>
            <Route path="*" element={<Navigate to="/rotina" replace />} />
          </Routes>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
