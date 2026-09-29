"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <main className="flex-1 overflow-y-auto">
        <div className="page-content">
          {children}
        </div>
      </main>

      <BottomNav />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--ink)",
          },
        }}
      />
    </div>
  );
}
