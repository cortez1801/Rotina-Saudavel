import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) nav("/rotina", { replace: true });
    else setErr(res.error);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen px-6 py-14 flex flex-col justify-center">
      <div className="ambient-glow" style={{ top: "-60px", right: "-40px", width: "240px", height: "240px", background: "var(--c1)" }} />
      <div className="ambient-glow" style={{ bottom: "-60px", left: "-40px", width: "220px", height: "220px", background: "var(--c2)", opacity: 0.2 }} />

      <div className="relative z-10 fade-up">
        <div className="mb-8 flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--c1)]/15 border border-[var(--c1)]/30 flex items-center justify-center">
            <Sparkles size={20} className="text-[var(--c1)]" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">rotina<span className="text-[var(--c2)]">.</span></span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mb-2">
          Bem-vindo<span className="text-[var(--c1)]">.</span>
        </h1>
        <p className="text-[#9CA3AF] text-base mb-10">Entre e siga com o seu dia com leveza.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">E-mail</label>
            <input
              data-testid="login-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] transition-all outline-none"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">Senha</label>
            <input
              data-testid="login-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {err && (
  <>
    <div
      data-testid="login-error"
      className="text-sm text-[var(--c3)] bg-[var(--c3)]/10 rounded-xl px-4 py-3 border border-[var(--c3)]/20"
    >
      {err}
    </div>

    <button
      type="button"
      onClick={() => nav("/forgot-password")}
      className="text-sm text-[var(--c1)] hover:underline mt-2"
    >
      Esqueceu sua senha?
    </button>
  </>
)}

          <button
            data-testid="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--c1)] text-[var(--bg-app)] font-semibold rounded-full py-4 mt-2 hover:bg-[var(--c2)] transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Entrar
          </button>
        </form>

        <p className="text-center text-sm text-[#9CA3AF] mt-8">
          Novo por aqui?{" "}
          <Link data-testid="go-to-register-link" to="/register" className="text-[var(--c1)] font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
