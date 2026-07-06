import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppShell() {
  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen pb-28 overflow-x-hidden">
      {/* ambient pastel glows */}
      <div
        className="ambient-glow"
        style={{ top: "-80px", left: "-40px", width: "260px", height: "260px", background: "var(--c1)" }}
      />
      <div
        className="ambient-glow"
        style={{ top: "40%", right: "-60px", width: "220px", height: "220px", background: "var(--c2)", opacity: 0.2 }}
      />
      <div className="relative z-10">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
