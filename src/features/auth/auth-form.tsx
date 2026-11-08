"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Focus, Sparkles } from "lucide-react";
import { apiRequest, getErrorMessage } from "@/lib/api-client";
import { useAuth, type User } from "@/features/auth/auth-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { refreshUser, setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest<{ user: User }>(
        `/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          body: JSON.stringify(
            isRegister ? { name, email, password } : { email, password },
          ),
        },
      );
      setUser(data.user);
      await refreshUser();
      router.replace("/dashboard");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link href="/" className="brand-lockup auth-brand">
          <span className="brand-mark"><Focus size={18} /></span>
          <span>little by little</span>
        </Link>
        <div className="auth-aside-content">
          <span className="auth-quote-mark">“</span>
          <h2>Every small step is a promise you keep to yourself.</h2>
          <p>Start where you are. Grow at your own pace.</p>
          <div className="auth-aside-flower">✳</div>
          <div className="auth-aside-note"><Sparkles size={15} /> Progress over perfection</div>
        </div>
        <span className="auth-aside-footer">A gentle reminder to keep going.</span>
      </div>

      <section className="auth-main">
        <Link href="/" className="auth-back"><ArrowLeft size={16} /> Back home</Link>
        <div className="auth-card">
          <span className="auth-mobile-mark"><Focus size={19} /></span>
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR OWN LITTLE SPACE</span>
          <h1>{isRegister ? "Let’s begin, gently." : "Welcome back."}</h1>
          <p className="auth-subtitle">
            {isRegister
              ? "Create an account and make room for the habits that matter."
              : "Pick up right where you left off."}
          </p>

          <form onSubmit={submit} className="auth-form">
            {isRegister && (
              <label className="form-field">
                <span>Your name</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}
            <label className="form-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </label>
            <label className="form-field">
              <span>Password</span>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? "At least 8 characters" : "Your password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={isRegister ? 8 : undefined}
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {isRegister && <small className="field-hint">Use at least 8 characters. Your password stays private.</small>}
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button type="submit" className="button button-dark auth-submit" disabled={submitting}>
              {submitting
                ? (isRegister ? "Creating your space…" : "Signing you in…")
                : (isRegister ? "Create your account" : "Log in")}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="auth-switch">
            {isRegister ? "Already have an account?" : "New around here?"}{" "}
            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Log in" : "Create an account"}
            </Link>
          </div>
          <div className="auth-privacy"><span>✳</span> Your goals are yours. Always.</div>
        </div>
      </section>
    </main>
  );
}
