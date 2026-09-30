import { Outlet } from "react-router";
import { BottomNav } from "@/components/BottomNav";
import { LegacyStateProvider } from "./App";

export function AppLayout() {
  return (
    <LegacyStateProvider>
      <div
        className="flex flex-col bg-background relative"
        style={{ minHeight: "100vh", fontFamily: "Inter, sans-serif" }}
      >
        <main className="flex-1 overflow-y-auto pb-28" style={{ scrollbarWidth: "none" }}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </LegacyStateProvider>
  );
}
