"use client";
import { AuthGate } from "@/components/auth-gate";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden bg-[#f4f5fa] font-sans antialiased text-slate-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto h-full">
          <div className="max-w-[1440px] mx-auto px-6 py-8 md:px-10 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}


