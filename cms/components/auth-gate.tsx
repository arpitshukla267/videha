"use client";
import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

const SESSION_KEY = "cms_auth";
const PASSWORD = process.env.NEXT_PUBLIC_CMS_PASSWORD || "admin123";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  if (!mounted) return null;
  if (authed) return <>{children}</>;

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (pw === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setError("Incorrect password");
      setPw("");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 border border-slate-200">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Videha Overseas</h1>
            <p className="text-sm text-slate-500 mt-1">Content Management System</p>
          </div>
        </div>

        <form onSubmit={login} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              placeholder="Enter CMS password"
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-4 py-3.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg py-3.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
