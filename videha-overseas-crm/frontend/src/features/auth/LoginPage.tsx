import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, ArrowRight, Compass } from "lucide-react";

interface LoginPageProps {
  onOpenPublicTracking: () => void;
}

const DEMO_ACCOUNTS = [
  {
    role: "Super Admin",
    email: "superadmin@videhaoverseas.com",
    password: "admin123",
  },
  {
    role: "Admin",
    email: "admin@videhaoverseas.com",
    password: "admin123",
  },
  {
    role: "Manager",
    email: "manager@videhaoverseas.com",
    password: "admin123",
  },
  {
    role: "Sales",
    email: "rahul.sharma@videhaoverseas.com",
    password: "sales123",
  },
  {
    role: "Operations",
    email: "vikram.singh@videhaoverseas.com",
    password: "ops123",
  },
] as const;

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenPublicTracking }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@videhaoverseas.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid corporate credentials.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
          VO
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-800">VIDEHA OVERSEAS</h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">Export Sales CRM</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 shadow-xs rounded-2xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@videhaoverseas.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? "Signing in…" : "Sign In to CRM"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-slate-400 font-medium">Quick fill (dev accounts)</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors ${
                    email === acc.email
                      ? "bg-sky-50 border-sky-300 text-sky-900 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onOpenPublicTracking}
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-medium transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Customer order tracking</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
