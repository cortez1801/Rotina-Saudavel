import { Sparkles } from "lucide-react";

export default function MotivationToast({ message }) {
  if (!message) return null;
  return (
    <div
      data-testid="motivation-toast"
      key={message + Math.random()}
      className="toast-slide fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full font-semibold text-sm bg-[var(--c2)] text-[var(--bg-app)] shadow-[0_10px_30px_rgba(167,243,208,0.35)] flex items-center gap-2 whitespace-nowrap max-w-[92%]"
    >
      <Sparkles size={16} strokeWidth={2.5} />
      <span className="truncate">{message}</span>
    </div>
  );
}
