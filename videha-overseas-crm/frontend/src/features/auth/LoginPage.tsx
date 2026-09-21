import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, ArrowRight, Compass, ShieldCheck } from "lucide-react";

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

export const LoginPage: React.FC<LoginPageProps> = ({
  onOpenPublicTracking,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid corporate credentials.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F6F8F6]">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between bg-[#0E3B2E] text-[#EAF3EE] px-12 py-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #ffffff 0, transparent 40%), radial-gradient(circle at 80% 70%, #ffffff 0, transparent 35%)",
          }}
        />

        <div className="opacity-0 relative z-10 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Videha Overseas"
            className="h-9 w-9 rounded-md object-contain bg-white/95 p-1"
          />
          <span className="text-sm font-semibold tracking-wide text-white">
            VIDEHA OVERSEAS
          </span>
        </div>

        <div className="relative z-10 max-w-sm -mt-44">
          <img
            src="/logo.png"
            alt="Videha Overseas"
            className="h-auto w-72 rounded-md object-cover p-1 -mb-16 -ml-8"
          />
          <h1 className="text-3xl font-semibold leading-snug text-white">
            Export operations,
            <br />
            managed with precision.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#BFDACB]">
            One workspace for sales, operations, and shipment tracking across
            every corporate account.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-[#A9CBB6]">
          <ShieldCheck className="w-4 h-4" />
          <span>Access restricted to authorized personnel</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img
              src="/logo.png"
              alt="Videha Overseas"
              className="h-10 w-10 rounded-md object-contain border border-[#D9E4DC] p-1"
            />
            <div>
              <p className="text-sm font-semibold text-[#0E3B2E]">
                VIDEHA OVERSEAS
              </p>
              <p className="text-xs text-slate-500">Export Sales CRM</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your corporate credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Corporate email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@videhaoverseas.com"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E7A52]/30 focus:border-[#1E7A52] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-[#1E7A52] hover:text-[#0E3B2E] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E7A52]/30 focus:border-[#1E7A52] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#0E3B2E] hover:bg-[#0A2E23] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onOpenPublicTracking}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E3B2E] font-medium transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Track a customer order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
