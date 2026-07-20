import { LocalNotifications } from "@capacitor/local-notifications";

function gerarIdNumerico(id) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  return hash;
}

export async function solicitarPermissao() {
  await LocalNotifications.requestPermissions();
}

export async function agendarNotificacoes(task) {
  console.log("AGENDANDO NOTIFICAÇÃO REAL", task);

  if (task.type !== "scheduled" || !task.due_date) {
    console.log("Tarefa não é agendada, ignorando");
    return;
  }

  const baseId = gerarIdNumerico(task.id);
  const vencimento = new Date(task.due_date);
  const agora = new Date();

  const seteDias = new Date(vencimento);
  seteDias.setDate(seteDias.getDate() - 7);
  seteDias.setHours(9, 0, 0, 0);

  const umDia = new Date(vencimento);
  umDia.setDate(umDia.getDate() - 1);
  umDia.setHours(9, 0, 0, 0);

  const hoje = new Date(vencimento);
  hoje.setHours(9, 0, 0, 0);

  const notifications = [];

  if (seteDias > agora) {
    notifications.push({
      id: baseId + 1,
      title: "Lumora",
      body: `Falta uma semana para "${task.title}".`,
      schedule: { at: seteDias },
    });
  }

  if (umDia > agora) {
    notifications.push({
      id: baseId + 2,
      title: "Lumora",
      body: `Amanhã vence "${task.title}".`,
      schedule: { at: umDia },
    });
  }

  if (hoje > agora) {
    notifications.push({
      id: baseId + 3,
      title: "Lumora",
      body: `Hoje vence "${task.title}".`,
      schedule: { at: hoje },
    });
  }

  console.log("NOTIFICAÇÕES CRIADAS:", notifications);

  if (notifications.length > 0) {
    notifications.forEach((n) => {
  n.schedule.at = new Date(Date.now() + 10000);
});

await LocalNotifications.schedule({
  notifications,
});

    console.log("NOTIFICAÇÕES AGENDADAS COM SUCESSO");
  } else {
    console.log("Nenhuma notificação futura para agendar");
  }
}

export async function cancelarNotificacoes(taskId) {
  const baseId = gerarIdNumerico(taskId);

  await LocalNotifications.cancel({
    notifications: [
      { id: baseId + 1 },
      { id: baseId + 2 },
      { id: baseId + 3 },
    ],
  });
}