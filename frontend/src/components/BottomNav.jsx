import { NavLink } from "react-router-dom";
import { ListTodo, Newspaper, BookHeart } from "lucide-react";
import ThemeSelector from "./ThemeSelector";

const tabs = [
  { to: "/rotina", label: "Rotina", icon: ListTodo },
  { to: "/mundo", label: "Mundo", icon: Newspaper },
  { to: "/diario", label: "Diário", icon: BookHeart },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] pt-3 pb-6 px-4 glass border-t border-white/5">
      <div className="flex justify-between items-center gap-2">
        <div className="pr-2 border-r border-white/10">
          <ThemeSelector />
        </div>

        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-4 py-1 rounded-full transition-all ${
                isActive
                  ? "text-[var(--c1)]"
                  : "text-[#9CA3AF] hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[11px] font-medium tracking-wide">
                  {label}
                </span>

                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[var(--c1)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}