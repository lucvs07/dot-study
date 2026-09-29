/* eslint-disable react-refresh/only-export-components */
import { ServiceError } from "@/services/contracts";

export function errorText(error: unknown): string {
  return error instanceof ServiceError ? error.message : "Algo deu errado. Tente de novo.";
}

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl p-4 text-sm flex items-center justify-between gap-3"
      style={{ background: "rgba(238,27,63,0.08)", color: "#B4102C", border: "1px solid rgba(238,27,63,0.25)" }}
    >
      <span>{errorText(error)}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-full font-semibold"
          style={{ background: "#EE1B3F", color: "white" }}
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
