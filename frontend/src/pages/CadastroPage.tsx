import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ErrorMessage } from "@/components/ErrorMessage";
import { BRAND } from "@/domain/brand";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout, Field, PrimaryButton } from "./LoginPage";

export function CadastroPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Seu dot está esperando. Ganhe 250 moedas de boas-vindas!">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome" type="text" value={name} onChange={setName} autoComplete="name" />
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint="mínimo 8 caracteres"
        />
        {error !== null && <ErrorMessage error={error} />}
        <PrimaryButton disabled={submitting}>{submitting ? "Criando…" : "Criar conta"}</PrimaryButton>
        <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          <Link to="/login" style={{ color: BRAND.purple, fontWeight: 600 }}>
            Já tenho conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
