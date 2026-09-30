import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Check, KeyRound, Mail, Moon, RotateCcw, Sun, User, UserCog, LogOut } from "lucide-react";
import { BRAND } from "@/domain/brand";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";
import { applyTheme, readTheme } from "@/app/providers";
import type { User as UserModel } from "@/services/contracts";

export function AjustesPage() {
  const services = useServices();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = useCurrentUser();
  const dotColor = user.dotColor;

  const [name, setName] = useState(user.name);
  const [nameSaved, setNameSaved] = useState(false);

  const [email, setEmail] = useState(user.email);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [theme, setThemeState] = useState<"light" | "dark">(readTheme);

  const applyUser = (updated: UserModel) => queryClient.setQueryData(queryKeys.me, updated);

  const nameMutation = useMutation({
    mutationFn: () => services.users.updateProfile({ name }),
    onSuccess: (updated) => {
      applyUser(updated);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    },
  });

  const emailMutation = useMutation({
    mutationFn: () => services.users.updateProfile({ email, currentPassword: emailPassword }),
    onSuccess: (updated) => {
      applyUser(updated);
      setEmailSaved(true);
      setEmailPassword("");
      setTimeout(() => setEmailSaved(false), 2000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => services.users.updateProfile({ currentPassword, newPassword }),
    onSuccess: (updated) => {
      applyUser(updated);
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordSaved(false), 2000);
    },
  });

  const handleTheme = (t: "light" | "dark") => {
    setThemeState(t);
    applyTheme(t);
  };

  const handleReset = () => {
    if (!services.resetDemoData) return;
    if (!window.confirm("Isso apaga suas mudanças e volta aos dados iniciais. Continuar?")) return;
    services.resetDemoData();
    queryClient.clear();
    navigate("/login");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="p-8" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.85rem",
            color: "var(--foreground)",
          }}
        >
          Ajustes
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Ajuste seu perfil e preferências
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Perfil */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
          <h2
            className="flex items-center gap-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            <User size={18} color={dotColor} /> Perfil
          </h2>
          <div>
            <label
              htmlFor="ajustes-nome"
              style={{
                fontFamily: "Inter",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Nome
            </label>
            <div className="flex gap-2">
              <input
                id="ajustes-nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all"
                style={
                  {
                    fontFamily: "Inter",
                    fontSize: "0.9rem",
                    color: "var(--foreground)",
                    "--tw-ring-color": dotColor,
                  } as React.CSSProperties
                }
              />
              <button
                onClick={() => nameMutation.mutate()}
                disabled={!name.trim() || nameMutation.isPending}
                className="px-4 py-2 rounded-xl whitespace-nowrap disabled:opacity-50"
                style={{ background: dotColor, color: BRAND.dark, fontFamily: "Inter", fontWeight: 600, fontSize: "0.85rem" }}
              >
                Salvar nome
              </button>
            </div>
            {nameSaved && (
              <p
                className="flex items-center gap-1"
                style={{ fontFamily: "Inter", fontSize: "0.75rem", color: BRAND.green, marginTop: 6 }}
              >
                <Check size={12} /> Salvo!
              </p>
            )}
            {nameMutation.error && (
              <div style={{ marginTop: 8 }}>
                <ErrorMessage error={nameMutation.error} />
              </div>
            )}
          </div>
        </div>

        {/* Aparência */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
          <h2
            className="flex items-center gap-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            <Sun size={18} color={dotColor} /> Aparência
          </h2>
          <div>
            <label
              style={{
                fontFamily: "Inter",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 10,
                display: "block",
              }}
            >
              Tema
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTheme("light")}
                className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all border"
                style={{
                  background: theme === "light" ? `${dotColor}14` : "var(--background)",
                  borderColor: theme === "light" ? dotColor : "var(--border)",
                  color: theme === "light" ? dotColor : "var(--muted-foreground)",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                <Sun size={16} /> Claro
              </button>
              <button
                onClick={() => handleTheme("dark")}
                className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all border"
                style={{
                  background: theme === "dark" ? `${dotColor}14` : "var(--background)",
                  borderColor: theme === "dark" ? dotColor : "var(--border)",
                  color: theme === "dark" ? dotColor : "var(--muted-foreground)",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                <Moon size={16} /> Escuro
              </button>
            </div>
          </div>
        </div>

        {/* Conta */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
          <h2
            className="flex items-center gap-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--foreground)",
            }}
          >
            <UserCog size={18} color={dotColor} /> Conta
          </h2>
          <div className="flex flex-col gap-5">
            {/* E-mail */}
            <div>
              <label
                htmlFor="ajustes-email"
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--muted-foreground)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                <Mail size={12} style={{ display: "inline", marginRight: 4 }} /> E-mail
              </label>
              <input
                id="ajustes-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 outline-none"
                style={{
                  background: "var(--input)",
                  fontFamily: "Inter",
                  fontSize: "0.88rem",
                  color: "var(--foreground)",
                }}
              />
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Senha atual"
                className="w-full rounded-xl px-4 py-2.5 outline-none"
                style={{
                  background: "var(--input)",
                  fontFamily: "Inter",
                  fontSize: "0.88rem",
                  color: "var(--foreground)",
                  marginTop: 8,
                }}
              />
              <button
                onClick={() => emailMutation.mutate()}
                disabled={!email.trim() || !emailPassword || emailMutation.isPending}
                className="px-4 py-2 rounded-xl disabled:opacity-50"
                style={{
                  background: dotColor,
                  color: BRAND.dark,
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  marginTop: 8,
                }}
              >
                Salvar email
              </button>
              {emailSaved && (
                <p
                  className="flex items-center gap-1"
                  style={{ fontFamily: "Inter", fontSize: "0.75rem", color: BRAND.green, marginTop: 6 }}
                >
                  <Check size={12} /> Salvo!
                </p>
              )}
              {emailMutation.error && (
                <div style={{ marginTop: 8 }}>
                  <ErrorMessage error={emailMutation.error} />
                </div>
              )}
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="ajustes-senha-atual"
                style={{
                  fontFamily: "Inter",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--muted-foreground)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                <KeyRound size={12} style={{ display: "inline", marginRight: 4 }} /> Senha
              </label>
              <input
                id="ajustes-senha-atual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha atual"
                className="w-full rounded-xl px-4 py-2.5 outline-none"
                style={{
                  background: "var(--input)",
                  fontFamily: "Inter",
                  fontSize: "0.88rem",
                  color: "var(--foreground)",
                }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                className="w-full rounded-xl px-4 py-2.5 outline-none"
                style={{
                  background: "var(--input)",
                  fontFamily: "Inter",
                  fontSize: "0.88rem",
                  color: "var(--foreground)",
                  marginTop: 8,
                }}
              />
              <button
                onClick={() => passwordMutation.mutate()}
                disabled={!currentPassword || !newPassword || passwordMutation.isPending}
                className="px-4 py-2 rounded-xl disabled:opacity-50"
                style={{
                  background: dotColor,
                  color: BRAND.dark,
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  marginTop: 8,
                }}
              >
                Alterar senha
              </button>
              {passwordSaved && (
                <p
                  className="flex items-center gap-1"
                  style={{ fontFamily: "Inter", fontSize: "0.75rem", color: BRAND.green, marginTop: 6 }}
                >
                  <Check size={12} /> Salvo!
                </p>
              )}
              {passwordMutation.error && (
                <div style={{ marginTop: 8 }}>
                  <ErrorMessage error={passwordMutation.error} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dados de demonstração */}
        {services.resetDemoData && (
          <div className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
            <h2
              className="flex items-center gap-2"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "var(--foreground)",
              }}
            >
              <RotateCcw size={18} color={dotColor} /> Dados de demonstração
            </h2>
            <button
              onClick={handleReset}
              className="self-start flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-card"
              style={{
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              Restaurar dados de demonstração
            </button>
          </div>
        )}

        {/* Sair */}
        <div className="flex gap-3">
          <button
            onClick={() => void handleLogout()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-card"
            style={{
              border: `1px solid ${BRAND.red}59`,
              color: BRAND.red,
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>
    </div>
  );
}
