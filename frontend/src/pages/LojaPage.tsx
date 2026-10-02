import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Check, Hexagon } from "lucide-react";
import { BRAND, DOT_COLORS } from "@/domain/brand";
import { DotAvatar } from "@/components/DotAvatar";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingState } from "@/components/LoadingState";
import { useCurrentUser } from "@/hooks/useAuth";
import { useServices } from "@/services/ServicesContext";
import { queryKeys } from "@/app/queryKeys";
import type { Accessory } from "@/services/contracts";

export function LojaPage() {
  const services = useServices();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const { dotColor, activeAccessoryId, coins, unlockedAccessoryIds } = user;

  const accessoriesQuery = useQuery({
    queryKey: queryKeys.accessories,
    queryFn: () => services.shop.listAccessories(),
  });

  const updateDotMutation = useMutation({
    mutationFn: (input: { dotColor?: string; activeAccessoryId?: string | null }) => services.users.updateDot(input),
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.me, updated),
  });

  const purchaseMutation = useMutation({
    mutationFn: (accessoryId: string) => services.shop.purchase(accessoryId),
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.me, updated),
  });

  if (accessoriesQuery.isLoading) return <LoadingState />;
  if (accessoriesQuery.error)
    return <ErrorMessage error={accessoriesQuery.error} onRetry={() => void accessoriesQuery.refetch()} />;

  const accessories = accessoriesQuery.data!;

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

      {(updateDotMutation.error || purchaseMutation.error) && (
        <div className="mb-6">
          <ErrorMessage error={updateDotMutation.error ?? purchaseMutation.error} />
        </div>
      )}

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
              <DotAvatar color={dotColor} accessory={activeAccessoryId} size={120} />
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
                {`${coins.toLocaleString("pt-BR")} moedas`}
              </span>
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
                  aria-label={`Cor ${c}`}
                  onClick={() => updateDotMutation.mutate({ dotColor: c })}
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
          {activeAccessoryId && (
            <button
              onClick={() => updateDotMutation.mutate({ activeAccessoryId: null })}
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
            {accessories.map((acc: Accessory) => {
              const isUnlocked = unlockedAccessoryIds.includes(acc.id);
              const isActive = activeAccessoryId === acc.id;
              const canAfford = coins >= acc.cost;
              const label = isUnlocked
                ? isActive
                  ? `Remover ${acc.name}`
                  : `Equipar ${acc.name}`
                : `Comprar ${acc.name}`;
              const isPending =
                (purchaseMutation.isPending && purchaseMutation.variables === acc.id) || updateDotMutation.isPending;
              return (
                <button
                  key={acc.id}
                  aria-label={label}
                  disabled={(!isUnlocked && !canAfford) || isPending}
                  onClick={() => {
                    if (isUnlocked) {
                      updateDotMutation.mutate({ activeAccessoryId: isActive ? null : acc.id });
                    } else if (canAfford) {
                      purchaseMutation.mutate(acc.id);
                    }
                  }}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.03] bg-card disabled:cursor-not-allowed"
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
