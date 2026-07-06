import { useEffect, useState } from "react";
import {
  Newspaper, Landmark, LineChart, HeartHandshake,
  Loader2, RefreshCw, ExternalLink, Clock,
} from "lucide-react";
import api from "../lib/api";

const CATS = [
  { key: "politics", label: "Política",       Icon: Landmark,       cssVar: "var(--c1)" },
  { key: "economy",  label: "Economia",       Icon: LineChart,      cssVar: "var(--c4)" },
  { key: "good",     label: "Boas notícias",  Icon: HeartHandshake, cssVar: "var(--c2)" },
];

function formatRelative(iso) {
  if (!iso) return "";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - then) / 1000));
    if (diffSec < 60) return "agora";
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `há ${days} d`;
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch { return ""; }
}

export default function MundoHoje() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("politics");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/news");
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const items = data?.[active] || [];
  const cat = CATS.find((c) => c.key === active);

  return (
    <div className="px-6 pt-12 pb-4 min-h-screen">
      <header className="mb-6 fade-up flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">Fontes reais e verificáveis</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mt-1">
            Mundo hoje<span className="text-[var(--c1)]">.</span>
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-2 flex items-center gap-1">
            <Newspaper size={12} className="text-[var(--c2)]" /> Feeds ao vivo de veículos brasileiros.
          </p>
        </div>
        <button
          data-testid="refresh-news-btn"
          onClick={load}
          disabled={loading}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
          aria-label="Atualizar"
        >
          <RefreshCw size={16} className={`text-[#9CA3AF] ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div data-testid="news-category-tabs" className="flex gap-2 overflow-x-auto no-scrollbar mb-5 -mx-1 px-1">
        {CATS.map(({ key, label, Icon, cssVar }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              data-testid={`news-cat-${key}`}
              onClick={() => setActive(key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95 ${
                isActive
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/10 text-[#9CA3AF] hover:text-white"
              }`}
              style={isActive ? { borderColor: cssVar, color: cssVar } : undefined}
            >
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#9CA3AF]">
          <Loader2 className="animate-spin mr-2" size={18} /> Buscando notícias...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-[#9CA3AF] py-16">Nenhuma notícia por enquanto.</div>
      ) : (
        <div data-testid="news-list" className="space-y-3">
          {items.map((n, i) => (
            <article
              key={n.id}
              data-testid={`news-card-${n.id}`}
              className="fade-up bg-[var(--bg-card)] border border-white/[0.06] rounded-3xl overflow-hidden relative"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className="absolute top-0 left-0 w-1 h-full z-10"
                style={{ background: cat.cssVar, opacity: 0.7 }}
              />
              {n.image && (
                <div className="relative w-full h-40 bg-black/40 overflow-hidden">
                  <img
                    src={n.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: `color-mix(in srgb, ${cat.cssVar} 15%, transparent)`, color: cat.cssVar }}
                  >
                    <Newspaper size={10} className="inline mr-1 -mt-0.5" /> {cat.label}
                  </span>
                  <span className="text-[11px] text-[#9CA3AF] truncate">{n.source}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold leading-tight mb-1.5 text-white">
                  {n.title}
                </h3>
                {n.summary && (
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{n.summary}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
                    <Clock size={10} /> {formatRelative(n.published_at) || "recente"}
                  </span>
                  {n.url && (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`news-link-${n.id}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        color: cat.cssVar,
                        background: `color-mix(in srgb, ${cat.cssVar} 12%, transparent)`,
                      }}
                    >
                      Ler matéria <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
