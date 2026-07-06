import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { BarChart3, Flower2, Heart, BookOpen, Loader2 } from "lucide-react";
import api from "../lib/api";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dayLabel(iso) {
  try {
    const d = new Date(iso + "T00:00:00Z");
    return DAYS_PT[d.getUTCDay()];
  } catch { return iso.slice(5); }
}

export default function WeeklyStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/diary/stats");
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chartData = (stats?.days || []).map((d) => ({
    day: dayLabel(d.date),
    minutos: d.meditation_minutes,
    gratidoes: d.gratitude_count,
    leituras: d.reading_count,
  }));

  const totals = stats?.totals || {};

  return (
    <section data-testid="weekly-stats-section" className="mb-8 fade-up">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center border"
          style={{
            background: "color-mix(in srgb, var(--c1) 15%, transparent)",
            borderColor: "color-mix(in srgb, var(--c1) 25%, transparent)",
          }}
        >
          <BarChart3 size={16} className="text-[var(--c1)]" />
        </div>
        <h2 className="font-heading font-semibold text-lg">Sua semana</h2>
      </div>

      <div className="bg-[var(--bg-card)] border border-white/10 rounded-3xl p-5">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-[#9CA3AF]">
            <Loader2 className="animate-spin mr-2" size={18} /> Calculando...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div data-testid="stat-meditation" className="rounded-2xl border border-white/5 bg-black/20 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#9CA3AF] mb-1">
                  <Flower2 size={11} className="text-[var(--c2)]" /> Minutos
                </div>
                <div className="font-heading text-2xl font-semibold text-[var(--c2)] tabular-nums">
                  {totals.total_meditation_minutes ?? 0}
                </div>
              </div>
              <div data-testid="stat-gratitude" className="rounded-2xl border border-white/5 bg-black/20 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#9CA3AF] mb-1">
                  <Heart size={11} className="text-[var(--c3)]" /> Gratidões
                </div>
                <div className="font-heading text-2xl font-semibold text-[var(--c3)] tabular-nums">
                  {totals.total_gratitude ?? 0}
                </div>
              </div>
              <div data-testid="stat-reading" className="rounded-2xl border border-white/5 bg-black/20 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#9CA3AF] mb-1">
                  <BookOpen size={11} className="text-[var(--c1)]" /> Leituras
                </div>
                <div className="font-heading text-2xl font-semibold text-[var(--c1)] tabular-nums">
                  {totals.total_reading ?? 0}
                </div>
              </div>
            </div>

            <div data-testid="weekly-chart" className="h-52 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#9CA3AF"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#F8F7FA" }}
                  />
                  <Bar dataKey="minutos" name="Min. meditação" fill="var(--c2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gratidoes" name="Gratidões" fill="var(--c3)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="leituras" name="Leituras" fill="var(--c1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[#9CA3AF] text-center mt-2">
              Últimos 7 dias — {totals.total_entries ?? 0} {totals.total_entries === 1 ? "dia salvo" : "dias salvos"}.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
