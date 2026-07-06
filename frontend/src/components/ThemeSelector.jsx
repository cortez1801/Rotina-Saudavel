import { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        data-testid="theme-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors active:scale-95"
        aria-label="Trocar tema de cores"
      >
        <Palette size={16} className="text-[var(--c1)]" />
      </button>
      {open && (
        <div
          data-testid="theme-menu"
          className="absolute left-0 bottom-full mb-3 w-56 z-50 rounded-2xl border border-white/10 bg-[var(--bg-card)] shadow-2xl p-2 fade-up"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF] px-3 pt-2 pb-1">
            Tema de cores
          </p>
          {themes.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                data-testid={`theme-option-${t.id}`}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active ? "bg-white/10 text-white" : "text-[#D1D5DB] hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex -space-x-1.5">
                    {t.swatch.map((c, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ background: c }}
                      />
                    ))}
                  </span>
                  <span className="font-medium">{t.label}</span>
                </span>
                {active && <Check size={14} className="text-[var(--c2)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
