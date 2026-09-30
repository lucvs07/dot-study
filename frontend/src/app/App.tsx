/* eslint-disable react-refresh/only-export-components -- LEGADO: removido na Task 15 (exporta views, hook e ROUTE_OF) */
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Lock, Check, Hexagon, Moon, Sun, User, Globe, Mail, KeyRound, UserCog, LogOut, Trash2 } from "lucide-react";
import { BRAND, DOT_COLORS } from "@/domain/brand";
import { DotAvatar } from "@/components/DotAvatar";
import { useCurrentUser } from "@/hooks/useAuth";
import { applyTheme, readTheme } from "./providers";

// ── Types ──────────────────────────────────────────────────────────────────

export type View = "dashboard" | "timer" | "feed" | "ranking" | "history" | "shop" | "settings";
// ── Data ──────────────────────────────────────────────────────────────────

const ACCESSORIES_LIST = [
  { id: "hat", name: "Chapéu de Formatura", cost: 500 },
  { id: "glasses", name: "Óculos Nerd", cost: 300 },
  { id: "crown", name: "Coroa Dourada", cost: 1200 },
  { id: "halo", name: "Auréola", cost: 800 },
  { id: "bow", name: "Laço Rosa", cost: 250 },
  { id: "horns", name: "Chifres", cost: 450 },
  { id: "bowler", name: "Chapéu Coco", cost: 600 },
  { id: "witch", name: "Chapéu de Bruxa", cost: 750 },
  { id: "party", name: "Chapéu de Festa", cost: 400 },
  { id: "shades", name: "Óculos Escuros", cost: 350 },
];

// ── ShopView ───────────────────────────────────────────────────────────────

function ShopViewLegacy({
  dotColor,
  setDotColor,
  activeAccessory,
  setActiveAccessory,
  coins,
  setCoins,
  unlockedAccessories,
  setUnlockedAccessories,
}: {
  dotColor: string;
  setDotColor: (c: string) => void;
  activeAccessory: string | null;
  setActiveAccessory: (a: string | null) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  unlockedAccessories: string[];
  setUnlockedAccessories: (a: string[]) => void;
}) {
  const handleUnlock = (acc: (typeof ACCESSORIES_LIST)[number]) => {
    if (coins >= acc.cost && !unlockedAccessories.includes(acc.id)) {
      setCoins((c) => c - acc.cost);
      setUnlockedAccessories([...unlockedAccessories, acc.id]);
      setActiveAccessory(acc.id);
    }
  };
  return (
    <div className="p-8" style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="mb-7">
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: "1.85rem",
            color: "var(--foreground)",
          }}
        >
          Personagem
        </h1>
        <p style={{ fontFamily: "Inter", fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: 4 }}>
          Customize seu dot com as moedas que você ganha estudando
        </p>
      </div>
      <div className="grid grid-cols-2 gap-10">
        <div className="flex flex-col gap-6">
          <div
            className="bg-card rounded-2xl p-10 flex flex-col items-center gap-5"
            style={{ border: "1px solid var(--border)" }}
          >
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  position: "absolute",
                  inset: -24,
                  borderRadius: "50%",
                  background: dotColor,
                  filter: "blur(30px)",
                  opacity: 0.18,
                  pointerEvents: "none",
                }}
              />
              <DotAvatar color={dotColor} accessory={activeAccessory} size={120} />
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: `${BRAND.yellow}18`, border: `1px solid ${BRAND.yellow}44` }}
            >
              <Hexagon size={16} fill={BRAND.yellow} color={BRAND.yellow} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: BRAND.yellow,
                  fontSize: "0.95rem",
                }}
              >
                {coins.toLocaleString("pt-BR")}
              </span>
              <span style={{ fontFamily: "Inter", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>moedas</span>
            </div>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.92rem",
                color: "var(--foreground)",
                marginBottom: 14,
              }}
            >
              Cor do personagem
            </p>
            <div className="flex flex-wrap gap-3">
              {DOT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setDotColor(c)}
                  className="w-10 h-10 rounded-full transition-all hover:scale-110"
                  style={{
                    background: c,
                    outline: dotColor === c ? `3px solid ${c}` : "none",
                    outlineOffset: 3,
                    boxShadow: dotColor === c ? `0 0 12px ${c}50` : "none",
                  }}
                />
              ))}
            </div>
          </div>
          {activeAccessory && (
            <button
              onClick={() => setActiveAccessory(null)}
              className="self-start px-4 py-2 rounded-xl text-sm bg-card hover:bg-muted transition-colors"
              style={{ color: "var(--muted-foreground)", fontFamily: "Inter", border: "1px solid var(--border)" }}
            >
              Remover acessório
            </button>
          )}
        </div>
        <div>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "0.92rem",
              color: "var(--foreground)",
              marginBottom: 16,
            }}
          >
            Acessórios
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ACCESSORIES_LIST.map((acc) => {
              const isUnlocked = unlockedAccessories.includes(acc.id);
              const isActive = activeAccessory === acc.id;
              const canAfford = coins >= acc.cost;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    if (isUnlocked) setActiveAccessory(isActive ? null : acc.id);
                    else if (canAfford) handleUnlock(acc);
                  }}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.03] bg-card"
                  style={{
                    border: `1.5px solid ${isActive ? `${dotColor}60` : "var(--border)"}`,
                    background: isActive ? `${dotColor}0C` : "var(--card)",
                    opacity: !isUnlocked && !canAfford ? 0.5 : 1,
                  }}
                >
                  <div className="flex justify-center mb-3">
                    <DotAvatar color={dotColor} accessory={acc.id} size={60} />
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: isActive ? dotColor : "var(--foreground)",
                      marginBottom: 6,
                    }}
                  >
                    {acc.name}
                  </div>
                  <div className="flex items-center justify-between">
                    {isUnlocked ? (
                      <span
                        className="flex items-center gap-1"
                        style={{ fontFamily: "Inter", fontSize: "0.7rem", color: isActive ? dotColor : BRAND.green }}
                      >
                        <Check size={11} /> {isActive ? "Equipado" : "Desbloqueado"}
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.72rem",
                          color: canAfford ? BRAND.yellow : "var(--muted-foreground)",
                        }}
                      >
                        <Hexagon
                          size={10}
                          fill={canAfford ? BRAND.yellow : "var(--muted-foreground)"}
                          color={canAfford ? BRAND.yellow : "var(--muted-foreground)"}
                        />{" "}
                        {acc.cost.toLocaleString("pt-BR")}
                      </span>
                    )}
                    {!isUnlocked && <Lock size={12} color="#9CA3AF" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

// ── SettingsView ───────────────────────────────────────────────────────────

function SettingsViewLegacy({
  userName,
  setUserName,
  theme,
  setTheme,
  dotColor,
}: {
  userName: string;
  setUserName: (n: string) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  dotColor: string;
}) {
  // ── Acesso ──────────────────────────────────────────────────────────────
  const [loginMethod, setLoginMethod] = useState<"google" | "email" | "password">("email");

  // ── Dados da conta ──────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(userName);
  const [displayNameSaved, setDisplayNameSaved] = useState(userName);
  const [email, setEmail] = useState("guilherme@email.com");
  const [emailSaved, setEmailSaved] = useState("guilherme@email.com");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const loginMethodNote: Record<string, string> = {
    google: "Conectado via Google. Você pode adicionar uma senha como método alternativo.",
    email: "Um link de acesso é enviado para o seu e-mail quando necessário.",
    password: "Acesso por e-mail e senha.",
  };

  const handleSavePassword = () => {
    if (!newPassword) return;
    setPasswordSaved(true);
    setNewPassword("");
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const handleResetPassword = () => {
    setResetSent(true);
    setTimeout(() => setResetSent(false), 3000);
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
          Configurações
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
              style={{
                fontFamily: "Inter",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Nome de exibição
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
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
                onClick={() => setTheme("light")}
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
                onClick={() => setTheme("dark")}
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

        {/* Acesso */}
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
            <Lock size={18} color={dotColor} /> Acesso
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "google" as const, icon: <Globe size={16} />, label: "Google" },
              { id: "email" as const, icon: <Mail size={16} />, label: "E-mail" },
              { id: "password" as const, icon: <KeyRound size={16} />, label: "Senha" },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setLoginMethod(id)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  background: loginMethod === id ? `${dotColor}24` : "var(--background)",
                  border: `1px solid ${loginMethod === id ? dotColor : "var(--border)"}`,
                  color: loginMethod === id ? dotColor : "var(--muted-foreground)",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <p style={{ fontFamily: "Inter", fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: 12 }}>
            {loginMethodNote[loginMethod]}
          </p>
        </div>

        {/* Dados da conta */}
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
            <UserCog size={18} color={dotColor} /> Dados da conta
          </h2>
          <div className="flex flex-col gap-5">
            {/* Nome de exibição */}
            <div>
              <label
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
                Nome de exibição
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    background: "var(--input)",
                    fontFamily: "Inter",
                    fontSize: "0.88rem",
                    color: "var(--foreground)",
                    paddingRight: displayName !== displayNameSaved ? 72 : 16,
                  }}
                />
                {displayName !== displayNameSaved && (
                  <button
                    onClick={() => {
                      setUserName(displayName);
                      setDisplayNameSaved(displayName);
                    }}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: dotColor,
                      color: BRAND.dark,
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
            {/* E-mail */}
            <div>
              <label
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
                E-mail
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    background: "var(--input)",
                    fontFamily: "Inter",
                    fontSize: "0.88rem",
                    color: "var(--foreground)",
                    paddingRight: email !== emailSaved ? 72 : 16,
                  }}
                />
                {email !== emailSaved && (
                  <button
                    onClick={() => setEmailSaved(email)}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: dotColor,
                      color: BRAND.dark,
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
            {/* Senha */}
            <div>
              <label
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
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-2.5 outline-none"
                  style={{
                    background: "var(--input)",
                    fontFamily: "Inter",
                    fontSize: "0.88rem",
                    color: "var(--foreground)",
                    paddingRight: newPassword ? 72 : 16,
                  }}
                />
                {newPassword && (
                  <button
                    onClick={handleSavePassword}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: dotColor,
                      color: BRAND.dark,
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Salvar
                  </button>
                )}
              </div>
              {passwordSaved && (
                <p
                  className="flex items-center gap-1"
                  style={{ fontFamily: "Inter", fontSize: "0.75rem", color: BRAND.green, marginTop: 6 }}
                >
                  <Check size={12} /> Senha atualizada
                </p>
              )}
            </div>
          </div>

          {/* Esqueci minha senha */}
          <button
            onClick={handleResetPassword}
            style={{
              fontFamily: "Inter",
              fontSize: "0.78rem",
              color: dotColor,
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              marginTop: 4,
              padding: 0,
            }}
          >
            Esqueci minha senha
          </button>
          {resetSent && (
            <div
              style={{
                marginTop: 10,
                padding: "12px 16px",
                borderRadius: 12,
                background: `${BRAND.green}1F`,
                border: `1px solid ${BRAND.green}59`,
                fontFamily: "Inter",
                fontSize: "0.78rem",
                color: "var(--foreground)",
              }}
            >
              Enviamos um link de redefinição para guilherme@email.com
            </div>
          )}
        </div>

        {/* Zona de perigo */}
        <div className="flex items-center gap-3" style={{ marginTop: 8 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span
            style={{
              fontFamily: "Inter",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--muted-foreground)",
              whiteSpace: "nowrap",
            }}
          >
            Zona de perigo
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.confirm("Deseja realmente sair?")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-card"
            style={{
              border: `1px solid ${BRAND.red}59`,
              color: BRAND.red,
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <LogOut size={15} /> Sair da conta
          </button>
          <button
            onClick={() => window.confirm("Esta ação é irreversível. Deseja excluir sua conta?")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-card"
            style={{
              border: "1px solid #b91c1c80",
              color: "#b91c1c",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <Trash2 size={15} /> Excluir conta
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LEGADO: removido na Task 15 ────────────────────────────────────────────
// Ponte temporária: os estados que viviam em `export default function App` agora
// ficam num provider montado no AppLayout, e cada view do protótipo ganha um
// wrapper sem props para ser montada numa rota. As Tasks 11–15 trocam cada
// wrapper por uma página real em `pages/` e apagam este arquivo.

export const ROUTE_OF: Record<View, string> = {
  dashboard: "/",
  timer: "/estudar",
  feed: "/feed",
  ranking: "/ranking",
  history: "/historico",
  shop: "/loja",
  settings: "/ajustes",
};

type LegacyState = {
  // Vindos do usuário logado, com sobrescrita local para as views antigas (loja/ajustes).
  dotColor: string;
  setDotColor: (c: string) => void;
  userName: string;
  setUserName: (n: string) => void;
  activeAccessory: string | null;
  setActiveAccessory: (a: string | null) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  unlockedAccessories: string[];
  setUnlockedAccessories: (a: string[]) => void;
};

const LegacyStateContext = createContext<LegacyState | null>(null);

export function LegacyStateProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  // LEGADO: removido na Task 15 — sobrescritas locais usadas só pelas views antigas.
  const [dotColorOverride, setDotColor] = useState<string | null>(null);
  const [userNameOverride, setUserName] = useState<string | null>(null);
  const [accessoryOverride, setAccessoryOverride] = useState<{ value: string | null } | null>(null);
  const [coinsOverride, setCoinsOverride] = useState<number | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(readTheme);
  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>(["hat", "glasses"]);

  const coins = coinsOverride ?? user.coins;
  const setCoins = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (action) =>
      setCoinsOverride((prev) => {
        const base = prev ?? user.coins;
        return typeof action === "function" ? action(base) : action;
      }),
    [user.coins],
  );
  const setActiveAccessory = useCallback((a: string | null) => setAccessoryOverride({ value: a }), []);
  const setTheme = useCallback((t: "light" | "dark") => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  const value: LegacyState = {
    dotColor: dotColorOverride ?? user.dotColor,
    setDotColor,
    userName: userNameOverride ?? user.name,
    setUserName,
    activeAccessory: accessoryOverride ? accessoryOverride.value : user.activeAccessoryId,
    setActiveAccessory,
    coins,
    setCoins,
    theme,
    setTheme,
    unlockedAccessories,
    setUnlockedAccessories,
  };
  return <LegacyStateContext.Provider value={value}>{children}</LegacyStateContext.Provider>;
}

export function useLegacyState(): LegacyState {
  const value = useContext(LegacyStateContext);
  if (!value) throw new Error("useLegacyState precisa estar dentro de <LegacyStateProvider>");
  return value;
}

export function ShopView() {
  const legacy = useLegacyState();
  return (
    <ShopViewLegacy
      dotColor={legacy.dotColor}
      setDotColor={legacy.setDotColor}
      activeAccessory={legacy.activeAccessory}
      setActiveAccessory={legacy.setActiveAccessory}
      coins={legacy.coins}
      setCoins={legacy.setCoins}
      unlockedAccessories={legacy.unlockedAccessories}
      setUnlockedAccessories={legacy.setUnlockedAccessories}
    />
  );
}

export function SettingsView() {
  const legacy = useLegacyState();
  return (
    <SettingsViewLegacy
      userName={legacy.userName}
      setUserName={legacy.setUserName}
      theme={legacy.theme}
      setTheme={legacy.setTheme}
      dotColor={legacy.dotColor}
    />
  );
}
