import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { DotAvatar } from "@/components/DotAvatar";
import { ErrorMessage } from "@/components/ErrorMessage";
import { StudyLogo } from "@/components/StudyLogo";
import { BRAND } from "@/domain/brand";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Bom te ver de novo! Bora estudar?">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Senha" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error !== null && <ErrorMessage error={error} />}
        <PrimaryButton disabled={submitting}>{submitting ? "Entrando…" : "Entrar"}</PrimaryButton>
        <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          Ainda não tem conta?{" "}
          <Link to="/cadastro" style={{ color: BRAND.purple, fontWeight: 600 }}>
            Criar conta
          </Link>
        </p>
        <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
          Conta de demonstração: demo@dotstudy.app · dotstudy123
        </p>
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <StudyLogo />
        <DotAvatar color={BRAND.teal} size={88} />
        <div
          className="w-full rounded-3xl p-6 bg-card flex flex-col gap-5"
          style={{ border: "1px solid var(--border)" }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.6rem",
                color: "var(--foreground)",
              }}
            >
              {title}
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hint?: string;
}) {
  const id = `f-${label.toLowerCase().replace(/\W+/g, "-")}`;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex flex-col gap-1.5 text-sm"
        style={{ fontWeight: 600, color: "var(--foreground)" }}
      >
        {label}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-describedby={hintId}
          required
          className="rounded-2xl px-4 py-3 bg-background outline-none focus:ring-2"
          style={{ border: "1px solid var(--border)", fontWeight: 400 }}
        />
      </label>
      {hint && (
        <span id={hintId} className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function PrimaryButton({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-2xl py-3 transition-transform hover:scale-[1.01] disabled:opacity-60"
      style={{ background: BRAND.teal, color: BRAND.dark, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}
    >
      {children}
    </button>
  );
}
