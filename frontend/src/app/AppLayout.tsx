import { Outlet } from "react-router";
import { BottomNav } from "@/components/BottomNav";
import { StudyProvider } from "@/content/StudyContext";

export function AppLayout() {
  return (
    <StudyProvider>
      <div
        className="flex flex-col bg-background relative"
        style={{ minHeight: "100vh", fontFamily: "Inter, sans-serif" }}
      >
        <main className="flex-1 overflow-y-auto pb-28" style={{ scrollbarWidth: "none" }}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </StudyProvider>
  );
}
