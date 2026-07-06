import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Loader2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (res.ok) nav("/rotina", { replace: true });
    else setErr(res.error);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen px-6 py-14 flex flex-col justify-center">
      <div className="ambient-glow" style={{ top: "-60px", left: "-40px", width: "240px", height: "240px", background: "var(--c2)", opacity: 0.25 }} />
      <div className="ambient-glow" style={{ bottom: "-60px", right: "-40px", width: "220px", height: "220px", background: "var(--c1)" }} />

      <div className="relative z-10 fade-up">
        <div className="mb-8 flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--c2)]/15 border border-[var(--c2)]/30 flex items-center justify-center">
            <Sparkles size={20} className="text-[var(--c2)]" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">rotina<span className="text-[var(--c2)]">.</span></span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mb-2">
          Crie a sua conta<span className="text-[var(--c2)]">.</span>
        </h1>
        <p className="text-[#9CA3AF] text-base mb-10">Cada dia mais leve começa aqui.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">Nome</label>
            <input
              data-testid="register-name-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] transition-all outline-none"
              placeholder="Como podemos te chamar"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">E-mail</label>
            <input
              data-testid="register-email-input"
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
              data-testid="register-password-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] transition-all outline-none"
              placeholder="mínimo 6 caracteres"
            />
          </div>

          {err && (
            <div data-testid="register-error" className="text-sm text-[var(--c3)] bg-[var(--c3)]/10 rounded-xl px-4 py-3 border border-[var(--c3)]/20">
              {err}
            </div>
          )}

          <button
            data-testid="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--c2)] text-[var(--bg-app)] font-semibold rounded-full py-4 mt-2 hover:bg-[var(--c1)] transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Criar conta
          </button>
        </form>

        <p className="text-center text-sm text-[#9CA3AF] mt-8">
          Já tem conta?{" "}
          <Link data-testid="go-to-login-link" to="/login" className="text-[var(--c1)] font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
