import { useEffect, useState } from "react";
import {
  Check,
  Plus,
  Trash2,
  LogOut,
  Loader2,
  Flame,
  CalendarDays,
  Repeat,
  Sparkles,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import MotivationToast from "../components/MotivationToast";
import {
  solicitarPermissao,
  agendarNotificacoes,
  cancelarNotificacoes,
} from "../services/notifications";

function todayLabel() {
  const d = new Date();
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
}

export default function Rotina() {
  

  function daysUntil(date) {
  const today = new Date();
  const due = new Date(date);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  const formattedDate = due.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  if (diff < 0)
    return {
      text: `${formattedDate} • Atrasada`,
      color: "text-red-500",
    };

  if (diff === 0)
    return {
      text: `${formattedDate} • Vence hoje`,
      color: "text-red-400",
    };

  if (diff === 1)
    return {
      text: `${formattedDate} • Falta 1 dia`,
      color: "text-orange-400",
    };

  if (diff <= 7)
    return {
      text: `${formattedDate} • Faltam ${diff} dias`,
      color: "text-yellow-400",
    };

  return {
    text: `${formattedDate} • Faltam ${diff} dias`,
    color: "text-green-400",
  };
}

  useEffect(() => {
  solicitarPermissao();
}, []);

  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [taskType, setTaskType] = useState("daily");
  const [repeatDays, setRepeatDays] = useState([]);
  const [dueDate, setDueDate] = useState("");
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

useEffect(() => {
  load();
}, []);

  useEffect(() => {
    if (!motivation) return;
    const t = setTimeout(() => setMotivation(""), 2600);
    return () => clearTimeout(t);
  }, [motivation]);

  const addTask = async (e) => {
  e?.preventDefault?.();

  const t = title.trim();
  if (!t) return;

  setCreating(true);

  try {
    const { data } = await api.post("/tasks", {
      title: t,
      type: taskType,
      due_date: dueDate,
      repeat_days: taskType === "recurring" ? repeatDays : [],
    });

    if (
      taskType === "recurring" &&
      !repeatDays.includes(
        ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]
      )
    ) {
      alert("✅ Tarefa criada! Ela aparecerá no próximo dia programado.");
    }

    console.log("AGENDANDO NOTIFICAÇÃO", data);
await agendarNotificacoes(data);

setTasks((prev) => [data, ...prev]);
setTitle("");
setTaskType("daily");
setRepeatDays([]);
setDueDate("");
setShowModal(false);
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
  const task = tasks.find((t) => t.id === id);

  setTasks((p) => p.filter((t) => t.id !== id));

  try {
    if (task) {
      await cancelarNotificacoes(task.id);
    }

    await api.delete(`/tasks/${id}`);
  } catch (_) {
    setTasks(prev);
  }
};

  const pending = tasks.filter((t) => !t.completed).length;

const dailyTasks = tasks.filter(
  (t) => t.type === "daily"
);

const recurringTasks = tasks.filter(
  (t) => t.type === "recurring"
);

const scheduledTasks = tasks
  .filter((t) => t.type === "scheduled")
  .sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );
  
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
          onClick={() => {
  console.log("CLIQUEI NO LOGOUT");
  logout();
}}
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

      <div className="mb-7 fade-up">
  <button
    onClick={() => setShowModal(true)}
    className="group w-full rounded-3xl border border-[var(--c2)]/20 bg-[var(--bg-card)] transition-all duration-300 hover:border-[var(--c2)]/60 hover:bg-[var(--c2)]/5 hover:shadow-[0_0_25px_rgba(168,85,247,0.18)] active:scale-[0.98]"
  >
    <div className="flex items-center justify-center gap-3 rounded-3xl bg-[var(--bg-card)] py-4 transition-all group-hover:bg-transparent">
      <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
        <Plus size={20} className="text-[var(--c2)]" />
      </div>

      <div className="text-left">
        <p className="font-semibold text-white">
          Nova tarefa
        </p>
        <p className="text-xs text-white/70">
          Diária ou agendada
        </p>
      </div>
    </div>
  </button>
</div>

      <section data-testid="tasks-list" className="space-y-6">

  {/* TAREFAS DIÁRIAS */}
<div>
  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
    <span className="text-white font-semibold tracking-wide">
      Diárias
    </span>

    <span className="text-xs text-white/45">
      {dailyTasks.length}
    </span>
  </div>

    {dailyTasks.length === 0 ? (
      <p className="text-sm text-[#9CA3AF]">
        Nenhuma tarefa diária.
      </p>
    ) : (
      dailyTasks.map((task, i) => (
        <div
          key={task.id}
          className="fade-up flex items-center gap-3 p-4 mb-3 bg-[var(--bg-card)] rounded-2xl border border-white/[0.06]"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <button
            onClick={() => toggleTask(task)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              task.completed
                ? "bg-[var(--c2)] border-[var(--c2)]"
                : "border-[var(--c1)]"
            }`}
          >
            {task.completed && <Check size={14} />}
          </button>

          <span
            className={`flex-1 ${
              task.completed
                ? "line-through text-[#9CA3AF]"
                : "text-white"
            }`}
          >
            {task.title}
          </span>

          <button onClick={() => deleteTask(task.id)}>
            <Trash2 size={16} className="text-[var(--c3)]" />
          </button>
        </div>
      ))
    )}
  </div>

{/* TAREFAS RECORRENTES */}

<div>

  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
    <span className="text-white font-semibold tracking-wide">
      Recorrentes
    </span>

    <span className="text-xs text-white/45">
      {recurringTasks.length}
    </span>
  </div>

  {recurringTasks.length === 0 ? (
    <p className="text-sm text-[#9CA3AF]">
  Nenhuma tarefa programada para hoje.
</p>
  ) : (
    recurringTasks.map((task, i) => (
      <div
        key={task.id}
        className="fade-up flex items-center gap-3 p-4 mb-3 bg-[var(--bg-card)] rounded-2xl border border-white/[0.06]"
        style={{ animationDelay: `${i * 30}ms` }}
      >

        <button
          onClick={() => toggleTask(task)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            task.completed
              ? "bg-[var(--c2)] border-[var(--c2)]"
              : "border-[var(--c1)]"
          }`}
        >
          {task.completed && <Check size={14} />}
        </button>

        <span
          className={`flex-1 ${
            task.completed
              ? "line-through text-[#9CA3AF]"
              : "text-white"
          }`}
        >
          {task.title}
        </span>

        <button onClick={() => deleteTask(task.id)}>
          <Trash2 size={16} className="text-[var(--c3)]" />
        </button>

      </div>
    ))
  )}

</div>

  {/* TAREFAS AGENDADAS */}
<div>

  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
  <span className="text-white font-semibold tracking-wide">
    Agendadas
  </span>

  <span className="text-xs text-white/45">
    {scheduledTasks.length}
  </span>
</div>

    {scheduledTasks.length === 0 ? (
      <p className="text-sm text-[#9CA3AF]">
        Nenhuma tarefa agendada.
      </p>
    ) : (
      scheduledTasks.map((task, i) => {
  const status = daysUntil(task.due_date);

  return (
    <div
      key={task.id}
      className="fade-up flex items-center gap-3 p-4 mb-3 bg-[var(--bg-card)] rounded-2xl border border-white/[0.06]"
      style={{ animationDelay: `${i * 30}ms` }}
    >
          <button
            onClick={() => toggleTask(task)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              task.completed
                ? "bg-[var(--c2)] border-[var(--c2)]"
                : "border-[var(--c1)]"
            }`}
          >
            {task.completed && <Check size={14} />}
          </button>

          <div className="flex-1">
            <span
              className={`block ${
                task.completed
                  ? "line-through text-[#9CA3AF]"
                  : "text-white"
              }`}
            >
              {task.title}
            </span>

            <span
  className={`block text-[11px] mt-1 font-medium ${status.color}`}
>
  {status.text}
</span>
          </div>

          <button onClick={() => deleteTask(task.id)}>
            <Trash2 size={16} className="text-[var(--c3)]" />
          </button>
                        </div>
      );
    })
    )}
  </div>

</section>
{showModal && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
    <div className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-white/10 p-6">

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[var(--c1)]/15 flex items-center justify-center">
          <Sparkles className="text-[var(--c1)]" size={22} />
        </div>

        <div>
          <h2 className="font-heading text-2xl font-semibold">
            Nova tarefa
          </h2>

          <p className="text-sm text-[#9CA3AF]">
            Organize seu próximo objetivo.
          </p>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Digite sua tarefa..."
        className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 outline-none mb-4"
      />

      <div className="grid grid-cols-3 gap-3 mb-5">

        <button
          type="button"
          onClick={() => setTaskType("daily")}
          className={`rounded-2xl p-4 border ${
            taskType === "daily"
              ? "border-[var(--c1)] bg-[var(--c1)]/15"
              : "border-white/10 bg-white/5"
          }`}
        >
          <Repeat className="mx-auto mb-2 text-[var(--c1)]" size={24}/>
          <p className="font-medium">Diária</p>
          <p className="text-xs text-[#9CA3AF]">
            Todos os dias
          </p>
        </button>


        <button
          type="button"
          onClick={() => setTaskType("recurring")}
          className={`rounded-2xl p-4 border ${
            taskType === "recurring"
              ? "border-[var(--c1)] bg-[var(--c1)]/15"
              : "border-white/10 bg-white/5"
          }`}
        >
          <Repeat className="mx-auto mb-2 text-[var(--c1)]" size={24}/>
          <p className="font-medium">Recorrente</p>
          <p className="text-xs text-[#9CA3AF]">
            Dias específicos
          </p>
        </button>


        <button
          type="button"
          onClick={() => setTaskType("scheduled")}
          className={`rounded-2xl p-4 border ${
            taskType === "scheduled"
              ? "border-[var(--c1)] bg-[var(--c1)]/15"
              : "border-white/10 bg-white/5"
          }`}
        >
          <CalendarDays className="mx-auto mb-2 text-[var(--c1)]" size={24}/>
          <p className="font-medium">Agendada</p>
          <p className="text-xs text-[#9CA3AF]">
            Data específica
          </p>
        </button>

      </div>


      {taskType === "recurring" && (
        <div className="mb-5">

          <p className="text-sm mb-3">
            Repetir em:
          </p>

          <div className="grid grid-cols-7 gap-2">

            {[
              ["mon","Seg"],
              ["tue","Ter"],
              ["wed","Qua"],
              ["thu","Qui"],
              ["fri","Sex"],
              ["sat","Sáb"],
              ["sun","Dom"],
            ].map(([day,label]) => (

              <button
                key={day}
                type="button"
                onClick={() =>
                  setRepeatDays((prev)=>
                    prev.includes(day)
                      ? prev.filter((d)=>d!==day)
                      : [...prev,day]
                  )
                }
                className={`rounded-xl py-2 text-xs border ${
                  repeatDays.includes(day)
                    ? "border-[var(--c1)] bg-[var(--c1)]/15"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {label}
              </button>

            ))}

          </div>

        </div>
      )}


      {taskType === "scheduled" && (
        <input
          type="date"
          value={dueDate}
          onChange={(e)=>setDueDate(e.target.value)}
          className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 mb-5"
        />
      )}


      <div className="flex gap-3">

        <button
          type="button"
          onClick={()=>{
            setShowModal(false);
            setTitle("");
            setTaskType("daily");
            setRepeatDays([]);
            setDueDate("");
          }}
          className="flex-1 rounded-2xl py-3 bg-white/5"
        >
          Cancelar
        </button>


        <button
          type="button"
          onClick={(e)=>addTask(e)}
          className="flex-1 rounded-2xl py-3 bg-[var(--c1)] text-black font-semibold"
        >
          Criar
        </button>

      </div>

    </div>
  </div>
)}
    </div>
  );
}