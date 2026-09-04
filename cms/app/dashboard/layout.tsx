"use client";
import { AuthGate } from "@/components/auth-gate";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-screen bg-[#f0f4f8]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-10 md:px-10 md:py-12">
            {children}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
