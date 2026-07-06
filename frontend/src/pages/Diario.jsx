import { useEffect, useState, useRef } from "react";
import { Heart, BookOpen, Flower2, Play, Pause, RotateCcw, Save, Trash2, Loader2 } from "lucide-react";
import api from "../lib/api";
import WeeklyStats from "../components/WeeklyStats";

function formatSecs(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return ""; }
}

export default function Diario() {
  const [gratitude, setGratitude] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookPage, setBookPage] = useState("");
  const [meditation, setMeditation] = useState("");

  // Timer: mode "up" = stopwatch, or number of seconds = countdown target
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [preset, setPreset] = useState(0); // 0 = livre (stopwatch), >0 = countdown from N sec
  const [finishedPulse, setFinishedPulse] = useState(false);
  const timerRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const load = async () => {
    const { data } = await api.get("/diary");
    setHistory(data);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (preset > 0) {
          const next = s - 1;
          if (next <= 0) {
            setRunning(false);
            setFinishedPulse(true);
            setTimeout(() => setFinishedPulse(false), 1500);
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.type = "sine"; o.frequency.value = 528;
              o.connect(g); g.connect(ctx.destination);
              g.gain.setValueAtTime(0.001, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
              g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
              o.start(); o.stop(ctx.currentTime + 1.9);
            } catch (_) { /* audio not available */ }
            return 0;
          }
          return next;
        }
        return s + 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, preset]);

  const pickPreset = (mins) => {
    setRunning(false);
    setPreset(mins * 60);
    setSeconds(mins * 60);
  };
  const pickStopwatch = () => {
    setRunning(false);
    setPreset(0);
    setSeconds(0);
  };

  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(""), 2500);
    return () => clearTimeout(t);
  }, [saveMsg]);

  const resetForm = () => {
    setGratitude(""); setBookTitle(""); setBookPage(""); setMeditation("");
    setSeconds(preset || 0); setRunning(false);
  };

  const meditationDoneSeconds = preset > 0 ? (preset - seconds) : seconds;

  const saveDay = async () => {
    if (!gratitude && !bookTitle && !meditation && meditationDoneSeconds === 0) {
      setSaveMsg("Escreva algo antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/diary", {
        gratitude, book_title: bookTitle, book_page: bookPage,
        meditation, meditation_seconds: meditationDoneSeconds,
      });
      setHistory((prev) => [data, ...prev]);
      resetForm();
      setSaveMsg("Dia salvo com carinho.");
      setStatsRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id) => {
    const prev = history;
    setHistory((h) => h.filter((e) => e.id !== id));
    try { await api.delete(`/diary/${id}`); }
    catch (_) { setHistory(prev); }
  };

  return (
    <div className="px-6 pt-12 pb-4">
      <header className="mb-8 fade-up">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">Autocuidado</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mt-1">
          Diário & foco<span className="text-[var(--c2)]">.</span>
        </h1>
      </header>

      {/* Gratitude */}
      <section data-testid="section-gratitude" className="mb-5 fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--c3)]/15 border border-[var(--c3)]/25 flex items-center justify-center">
            <Heart size={16} className="text-[var(--c3)]" />
          </div>
          <h2 className="font-heading font-semibold text-lg">Gratidão do dia</h2>
        </div>
        <textarea
          data-testid="gratitude-input"
          rows={3}
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
          placeholder="Sou grato(a) hoje por..."
          className="w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] outline-none transition-all resize-none"
        />
      </section>

      {/* Reading */}
      <section data-testid="section-reading" className="mb-5 fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--c1)]/15 border border-[var(--c1)]/25 flex items-center justify-center">
            <BookOpen size={16} className="text-[var(--c1)]" />
          </div>
          <h2 className="font-heading font-semibold text-lg">Leituras</h2>
        </div>
        <div className="space-y-3">
          <input
            data-testid="book-title-input"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="Livro atual"
            className="w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] outline-none"
          />
          <input
            data-testid="book-page-input"
            value={bookPage}
            onChange={(e) => setBookPage(e.target.value)}
            placeholder="Capítulo ou página onde parei"
            className="w-full bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] outline-none"
          />
        </div>
      </section>

      {/* Meditation */}
      <section data-testid="section-meditation" className="mb-6 fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--c2)]/15 border border-[var(--c2)]/25 flex items-center justify-center">
            <Flower2 size={16} className="text-[var(--c2)]" />
          </div>
          <h2 className="font-heading font-semibold text-lg">Oração & meditação</h2>
        </div>

        <div className="bg-[var(--bg-card)] border border-white/10 rounded-3xl p-5">
          {/* Preset selector */}
          <div data-testid="timer-presets" className="flex flex-wrap items-center gap-2 mb-4">
            {[
              { label: "Livre", mins: 0 },
              { label: "5 min", mins: 5 },
              { label: "10 min", mins: 10 },
              { label: "15 min", mins: 15 },
            ].map(({ label, mins }) => {
              const isActive = (mins === 0 && preset === 0) || preset === mins * 60;
              return (
                <button
                  key={label}
                  data-testid={`timer-preset-${mins}`}
                  onClick={() => (mins === 0 ? pickStopwatch() : pickPreset(mins))}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                    isActive
                      ? "bg-[var(--c1)] text-[var(--bg-app)] border-[var(--c1)]"
                      : "bg-transparent text-[#9CA3AF] border-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center py-2">
            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                running ? "animate-pulse" : ""
              } ${finishedPulse ? "checkbox-pop" : ""}`}
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(167,243,208,0.25), rgba(196,181,253,0.15) 60%, transparent 75%)",
                boxShadow: running ? "0 0 60px rgba(167,243,208,0.35)" : "0 0 30px rgba(196,181,253,0.20)",
              }}
            >
              <span data-testid="timer-display" className="font-heading text-3xl font-semibold tabular-nums">
                {formatSecs(seconds)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button
                data-testid="timer-toggle-btn"
                onClick={() => setRunning((r) => !r)}
                disabled={preset > 0 && seconds === 0}
                className="px-5 py-2.5 rounded-full bg-[var(--c2)] text-[var(--bg-app)] text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-40"
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                {running ? "Pausar" : "Iniciar"}
              </button>
              <button
                data-testid="timer-reset-btn"
                onClick={() => { setSeconds(preset || 0); setRunning(false); }}
                className="px-4 py-2.5 rounded-full bg-white/5 text-white text-sm flex items-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw size={14} /> Zerar
              </button>
            </div>
            {finishedPulse && (
              <p className="text-xs text-[var(--c2)] mt-3 fade-up">Sessão concluída. Respire fundo.</p>
            )}
          </div>
          <textarea
            data-testid="meditation-input"
            rows={3}
            value={meditation}
            onChange={(e) => setMeditation(e.target.value)}
            placeholder="Intenções, pensamentos ou orações de hoje..."
            className="mt-5 w-full bg-[var(--bg-app)] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-[#9CA3AF] focus:border-[var(--c1)] focus:ring-1 focus:ring-[var(--c1)] outline-none resize-none"
          />
        </div>
      </section>

      <button
        data-testid="save-day-btn"
        onClick={saveDay}
        disabled={saving}
        className="w-full bg-[var(--c1)] text-[var(--bg-app)] font-semibold rounded-full py-4 mb-2 hover:bg-[var(--c2)] transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        Salvar dia
      </button>
      {saveMsg && (
        <p data-testid="save-day-message" className="text-center text-sm text-[var(--c2)] mb-4">{saveMsg}</p>
      )}

      <div className="mt-8">
        <WeeklyStats key={statsRefreshKey} />
      </div>

      {/* History */}
      <section className="mt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF] mb-4">Histórico</p>
        {history.length === 0 ? (
          <div className="text-center text-[#9CA3AF] py-8 text-sm">
            Ainda não há dias salvos.
          </div>
        ) : (
          <div data-testid="diary-history" className="space-y-3">
            {history.map((h) => (
              <article
                key={h.id}
                data-testid={`diary-entry-${h.id}`}
                className="bg-[var(--bg-card)] border border-white/[0.06] rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-[0.15em] text-[var(--c1)]">{formatDate(h.created_at)}</span>
                  <button
                    data-testid={`delete-diary-${h.id}`}
                    onClick={() => deleteEntry(h.id)}
                    className="p-1.5 rounded-full text-[var(--c3)]/70 hover:text-[var(--c3)] hover:bg-[var(--c3)]/10 transition-colors"
                    aria-label="Deletar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {h.gratitude && (
                  <p className="text-sm text-white mb-1"><span className="text-[var(--c3)]">Gratidão:</span> {h.gratitude}</p>
                )}
                {h.book_title && (
                  <p className="text-sm text-white mb-1">
                    <span className="text-[var(--c1)]">Livro:</span> {h.book_title}
                    {h.book_page && <span className="text-[#9CA3AF]"> — {h.book_page}</span>}
                  </p>
                )}
                {h.meditation && (
                  <p className="text-sm text-white mb-1"><span className="text-[var(--c2)]">Meditação:</span> {h.meditation}</p>
                )}
                {h.meditation_seconds > 0 && (
                  <p className="text-xs text-[#9CA3AF] mt-1">Tempo em silêncio: {formatSecs(h.meditation_seconds)}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
