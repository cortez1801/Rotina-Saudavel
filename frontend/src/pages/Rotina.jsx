import { useEffect, useState } from "react";
import { Check, Plus, Trash2, LogOut, Loader2, Flame } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import MotivationToast from "../components/MotivationToast";

function todayLabel() {
  const d = new Date();
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
}

export default function Rotina() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [poppedId, setPoppedId] = useState(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  const load = async () => {
    try {
      const [tasksRes, streakRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/streak").catch(() => ({ data: { current: 0, longest: 0 } })),
      ]);
      setTasks(tasksRes.data);
      setStreak(streakRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!motivation) return;
    const t = setTimeout(() => setMotivation(""), 2600);
    return () => clearTimeout(t);
  }, [motivation]);

  const addTask = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setCreating(true);
    try {
      const { data } = await api.post("/tasks", { title: t });
      setTasks((prev) => [data, ...prev]);
      setTitle("");
    } finally {
      setCreating(false);
    }
  };

  const toggleTask = async (task) => {
    const nextCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)));
    setPoppedId(task.id);
    setTimeout(() => setPoppedId(null), 350);
    try {
      await api.patch(`/tasks/${task.id}`, { completed: nextCompleted });
      if (nextCompleted) {
        try {
          const { data } = await api.post("/motivation", { task_title: task.title });
          setMotivation(data.message);
        } catch (_) {
          setMotivation("Bom trabalho!");
        }
      }
    } catch (_) {
      // rollback on failure
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !nextCompleted } : t)));
    }
  };

  const deleteTask = async (id) => {
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch (_) {
      setTasks(prev);
    }
  };

  const pending = tasks.filter((t) => !t.completed).length;

  return (
    <div className="px-6 pt-12 pb-4">
      <MotivationToast message={motivation} />

      <header className="flex items-start justify-between mb-6 fade-up">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">{todayLabel()}</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mt-1">
            Minha rotina<span className="text-[var(--c1)]">.</span>
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-2" data-testid="tasks-pending-count">
            {pending === 0 ? "Tudo em dia, respire fundo." : `${pending} ${pending === 1 ? "tarefa pendente" : "tarefas pendentes"}`}
          </p>
        </div>
        <button
          data-testid="logout-btn"
          onClick={logout}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors active:scale-95"
          aria-label="Sair"
        >
          <LogOut size={18} className="text-[#9CA3AF]" />
        </button>
      </header>

      {/* Streak card */}
      <div
        data-testid="streak-card"
        className="fade-up mb-6 flex items-center gap-3 p-4 rounded-2xl border border-[var(--c3)]/20"
        style={{ background: "linear-gradient(135deg, rgba(253,164,175,0.10), rgba(196,181,253,0.10))" }}
      >
        <div className="w-11 h-11 rounded-xl bg-[var(--c3)]/15 border border-[var(--c3)]/30 flex items-center justify-center shrink-0">
          <Flame size={20} className="text-[var(--c3)]" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium leading-tight">
            {streak.current === 0
              ? "Comece hoje o seu primeiro dia salvo"
              : `${streak.current} ${streak.current === 1 ? "dia" : "dias"} seguidos de autocuidado`}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {streak.longest > streak.current
              ? `Recorde: ${streak.longest} dias — vamos superar?`
              : streak.current > 0 ? "Continue firme, você está no seu recorde." : "Salve seu dia na aba Diário."}
          </p>
        </div>
        <div className="text-right">
          <span data-testid="streak-current" className="font-heading text-2xl font-semibold text-[var(--c3)]">
            {streak.current}
          </span>
        </div>
      </div>

      <form onSubmit={addTask} className="mb-6 fade-up">
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-white/10 rounded-2xl p-2 pl-4 focus-within:border-[var(--c1)] transition-all">
          <input
            data-testid="task-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-1 bg-transparent outline-none text-white placeholder:text-[#9CA3AF] text-sm"
          />
          <button
            data-testid="add-task-btn"
            type="submit"
            disabled={creating || !title.trim()}
            className="w-10 h-10 shrink-0 rounded-full bg-[var(--c1)] text-[var(--bg-app)] flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            aria-label="Adicionar tarefa"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
          </button>
        </div>
      </form>

      <section data-testid="tasks-list" className="space-y-3">
        {loading ? (
          <div className="text-center text-[#9CA3AF] py-8">Carregando...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-[#9CA3AF] py-16 fade-up">
            <p className="text-base">Seu dia está em branco.</p>
            <p className="text-sm mt-1">Que tal começar por uma tarefa pequena?</p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <div
              key={task.id}
              data-testid={`task-item-${task.id}`}
              className="fade-up flex items-center gap-3 p-4 bg-[var(--bg-card)] rounded-2xl border border-white/[0.06] active:scale-[0.99] transition-transform"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <button
                data-testid={`toggle-task-${task.id}`}
                onClick={() => toggleTask(task)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  task.completed
                    ? "bg-[var(--c2)] border-[var(--c2)]"
                    : "border-[var(--c1)] hover:bg-[var(--c1)]/10"
                } ${poppedId === task.id ? "checkbox-pop" : ""}`}
                aria-label={task.completed ? "Desmarcar" : "Concluir"}
              >
                {task.completed && <Check size={14} strokeWidth={3} className="text-[var(--bg-app)]" />}
              </button>
              <span
                className={`flex-1 text-sm transition-all ${
                  task.completed ? "line-through text-[#9CA3AF]" : "text-white"
                }`}
              >
                {task.title}
              </span>
              <button
                data-testid={`delete-task-${task.id}`}
                onClick={() => deleteTask(task.id)}
                className="p-2 rounded-full text-[var(--c3)] opacity-70 hover:opacity-100 hover:bg-[var(--c3)]/10 active:scale-90 transition-all"
                aria-label="Deletar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
