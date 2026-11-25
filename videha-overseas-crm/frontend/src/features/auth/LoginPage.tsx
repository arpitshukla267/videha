import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  Lock,
  Mail,
  ArrowRight,
  Compass,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

interface LoginPageProps {
  onOpenPublicTracking: () => void;
}

const DEMO_ACCOUNTS = [
  {
    role: "Managing Director (Super Admin)",
    email: "superadmin@videhaoverseas.com",
    password: "admin123",
  },
  {
    role: "Shilpa Shelar (Sales / CRM)",
    email: "shilpasachin31@gmail.com",
    password: "sales123",
  },
  {
    role: "Sejal Bidgar (Sales / Marketing / CMS)",
    email: "sejalbidgar@gmail.com",
    password: "sales123",
  },
] as const;

// Screenshot me quick sign-in visible nahi hai, isliye default false.
// Dev/testing ke time true kar do – feature intact hai.
const SHOW_QUICK_SIGNIN = false;

const INVALID_CREDENTIALS_MESSAGE =
  "Your credentials were incorrect. Please try again.";

const draft = {
  email: "",
  password: "",
  error: null as string | null,
};

const FONT = { fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif" };

const INPUT_BASE =
  "w-full h-[52px] border border-slate-200 bg-[#FAFBFA] rounded-lg text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E7A52]/30 focus:border-[#1E7A52] transition-colors";

export const LoginPage: React.FC<LoginPageProps> = ({
  onOpenPublicTracking,
}) => {
  const { login } = useAuth();
  const [email, setEmailState] = useState(draft.email);
  const [password, setPasswordState] = useState(draft.password);
  const [error, setErrorState] = useState<string | null>(draft.error);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password flow state
  const [authMode, setAuthMode] = useState<"login" | "forgot">("login");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const setEmail = (v: string) => {
    draft.email = v;
    setEmailState(v);
  };
  const setPassword = (v: string) => {
    draft.password = v;
    setPasswordState(v);
  };
  const setError = (v: string | null) => {
    draft.error = v;
    setErrorState(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      draft.email = "";
      draft.password = "";
      draft.error = null;
    } catch {
      setError(INVALID_CREDENTIALS_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Forgot Password
  const handleStartForgotPassword = () => {
    setAuthMode("forgot");
    setForgotStep(1);
    setForgotEmail(email || "");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError(null);
    setForgotSuccessMsg(null);
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);
    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail) {
      setForgotError("Please enter your corporate email.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.auth.forgotPassword(targetEmail);
      setForgotSuccessMsg(res.message);
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(
        err.message || "Failed to process password reset request.",
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const targetOtp = otp.trim();
    if (!targetOtp || targetOtp.length < 4) {
      setForgotError("Please enter the verification code sent to your email.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.auth.verifyOtp(
        forgotEmail.trim().toLowerCase(),
        targetOtp,
      );
      setResetToken(res.resetToken);
      setForgotSuccessMsg(res.message);
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || "Invalid or expired verification code.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.auth.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        resetToken,
        newPassword,
      });
      setForgotSuccessMsg(res.message);
      setForgotStep(4);
    } catch (err: any) {
      setForgotError(err.message || "Failed to reset password.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleReturnToLogin = (prefillEmail?: string) => {
    setAuthMode("login");
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    setPassword("");
    setError(null);
    setForgotError(null);
    setForgotSuccessMsg(null);
  };

  return (
    <div className="min-h-screen flex bg-[#F6F8F6]" style={FONT}>
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

      {/* ───────── Form panel ───────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-[480px]">
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img
              src="/logo.png"
              alt="Videha Overseas"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* LOGIN VIEW */}
          {authMode === "login" && (
            <>
              <div className="mb-10">
                <h2 className="text-[30px] font-semibold leading-tight text-[#0B1B2B]">
                  Sign in
                </h2>
                <p className="mt-1.5 text-[15px] text-slate-500">
                  Enter your corporate credentials to continue.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[15px] font-medium text-slate-800 mb-2">
                    Corporate email
                  </label>
                  <div className="relative">
                    <Mail className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@videhaoverseas.com"
                      className={`${INPUT_BASE} pl-12 pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[15px] font-medium text-slate-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleStartForgotPassword}
                      className="text-[13px] font-medium text-[#1E7A52] hover:text-[#0E3B2E] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${INPUT_BASE} pl-12 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-[18px] h-[18px]" />
                      ) : (
                        <Eye className="w-[18px] h-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[50px] px-4 bg-[#0E3B2E] hover:bg-[#0A2E23] text-white rounded-lg text-[15px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
                >
                  <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              {SHOW_QUICK_SIGNIN && (
                <div className="mt-6 pt-5 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Team quick sign-in:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {DEMO_ACCOUNTS.slice(0, 4).map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setEmail(acc.email);
                          setPassword(acc.password);
                          setError(null);
                        }}
                        className="px-2 py-1.5 text-left text-xs bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 text-slate-700 rounded border border-slate-200 transition-colors truncate"
                        title={`${acc.role} (${acc.email})`}
                      >
                        {acc.role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {authMode === "forgot" && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 shadow-sm">
              <button
                type="button"
                onClick={() => handleReturnToLogin()}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>

              <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-3">
                <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#1E7A52]" />
                  Password Recovery
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  Step {forgotStep} of 3
                </span>
              </div>

              {forgotError && (
                <div
                  role="alert"
                  className="mb-4 px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs leading-relaxed"
                >
                  {forgotError}
                </div>
              )}

              {forgotSuccessMsg && forgotStep < 4 && (
                <div className="mb-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs leading-relaxed">
                  {forgotSuccessMsg}
                </div>
              )}

              {/* STEP 1 */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900">
                      Enter your corporate email
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      Enter the email address registered with your CRM account.
                      We will verify your account and send a 6-digit
                      verification code.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Corporate Login Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@videhaoverseas.com"
                        className="w-full pl-10 pr-3.5 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1E7A52]/30 focus:border-[#1E7A52]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full py-2.5 px-4 bg-[#0E3B2E] hover:bg-[#0A2E23] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>
                      {isForgotLoading
                        ? "Verifying & Sending OTP…"
                        : "Send Verification Code"}
                    </span>
                    {!isForgotLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}

              {/* STEP 2 */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900">
                      Enter verification code
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      A 6-digit verification code was sent to{" "}
                      <strong className="text-stone-800">{forgotEmail}</strong>.
                      Enter it below to proceed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      6-Digit Security Code (OTP)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="123456"
                      className="w-full text-center text-xl font-mono tracking-[0.3em] font-semibold py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E7A52]/30 focus:border-[#1E7A52]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading || otp.length < 4}
                    className="w-full py-2.5 px-4 bg-[#0E3B2E] hover:bg-[#0A2E23] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>
                      {isForgotLoading
                        ? "Verifying Code…"
                        : "Verify Security Code"}
                    </span>
                    {!isForgotLoading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="hover:text-stone-900"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isForgotLoading}
                      className="inline-flex items-center gap-1 text-[#1E7A52] hover:text-[#0E3B2E] font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Resend code
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3 */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900">
                      Create new password
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      Verification successful. Set a new password for{" "}
                      <strong className="text-stone-800">{forgotEmail}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      New Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1E7A52]/30 focus:border-[#1E7A52]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1E7A52]/30 focus:border-[#1E7A52]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isForgotLoading || !newPassword || !confirmPassword
                    }
                    className="w-full py-2.5 px-4 bg-[#0E3B2E] hover:bg-[#0A2E23] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>
                      {isForgotLoading
                        ? "Saving Password…"
                        : "Save New Password"}
                    </span>
                    {!isForgotLoading && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </form>
              )}

              {/* STEP 4 */}
              {forgotStep === 4 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900">
                      Password reset successful
                    </h3>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      Your password has been securely updated. You can now sign
                      in using your new credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReturnToLogin(forgotEmail)}
                    className="w-full py-2.5 px-4 bg-[#0E3B2E] hover:bg-[#0A2E23] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Sign in with new password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-9 pt-6 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onOpenPublicTracking}
              className="inline-flex items-center gap-2 text-[15px] text-slate-500 hover:text-[#0E3B2E] font-medium transition-colors"
            >
              <Compass className="w-[18px] h-[18px]" />
              <span>Track a customer order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
