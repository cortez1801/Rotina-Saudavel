import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import {
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Moon,
} from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const nav = useNavigate();

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 8
      ? 1
      : /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)
      ? 3
      : 2;

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        new_password: password,
      });

      setSuccess(true);
      setMessage(data.message);

      setTimeout(() => {
        nav("/login");
      }, 2200);
    } catch (e) {
      setError(
        e.response?.data?.detail || "Erro ao alterar a senha."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="relative w-full max-w-md mx-auto min-h-screen px-6 py-14 flex flex-col justify-center">

      {!success ? (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Moon size={30} className="text-white" />
            </div>
          </div>

          <h1 className="font-heading text-5xl font-semibold mb-2 text-center">
            Recuperar senha
            <span className="text-[var(--c1)]">.</span>
          </h1>

          <p className="text-[#9CA3AF] text-center mb-8">
            Só mais um passo para voltar à sua rotina.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-heading text-5xl font-semibold mb-2 text-center">
            Tudo pronto
            <span className="text-green-400">.</span>
          </h1>

          <p className="text-[#9CA3AF] text-center mb-8">
            Sua senha foi alterada com sucesso.
          </p>
        </>
      )}

      {!success && (
        <form
          onSubmit={submit}
          className="space-y-4 transition-all duration-500"
        >
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] outline-none transition"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 pr-14 text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] outline-none transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition"
            >
              {showPassword ? (
                <Eye size={20} />
              ) : (
                <EyeOff size={20} />
              )}
            </button>
          </div>

          <div className="mt-2">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  passwordStrength === 1
                    ? "bg-red-500 w-1/3"
                    : passwordStrength === 2
                    ? "bg-yellow-400 w-2/3"
                    : passwordStrength === 3
                    ? "bg-green-500 w-full"
                    : "w-0"
                }`}
              />
            </div>

            <p className="text-xs mt-2 text-[#9CA3AF]">
              {passwordStrength === 0 && "Digite uma senha"}
              {passwordStrength === 1 && "Senha fraca"}
              {passwordStrength === 2 && "Senha média"}
              {passwordStrength === 3 && "Senha forte"}
            </p>
          </div>

          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              placeholder="Confirmar nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 pr-14 text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] outline-none transition"
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition"
            >
              {showConfirm ? (
                <Eye size={20} />
              ) : (
                <EyeOff size={20} />
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--c1)] text-[var(--bg-app)] font-semibold py-4 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          >
            {loading && (
              <Loader2
                size={18}
                className="animate-spin"
              />
            )}

            {loading ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      )}

      {success && (
        <div className="mt-6 rounded-3xl border border-green-400/20 bg-green-500/10 p-8 text-center animate-pulse">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle
              size={48}
              className="text-green-400"
            />
          </div>

          <h2 className="text-2xl font-semibold text-green-300">
            Senha alterada!
          </h2>

          <p className="mt-3 text-green-400">
            {message}
          </p>

          <p className="mt-4 text-xs text-green-400/70">
            Redirecionando para o login...
          </p>
        </div>
      )}

      {!success && (
        <Link
          to="/login"
          className="mt-6 text-center text-[var(--c1)] hover:underline"
        >
          Voltar para o login
        </Link>
      )}
    </div>
  );
}