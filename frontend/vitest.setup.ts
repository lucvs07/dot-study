import { Blob as NodeBlob } from "node:buffer";
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// O Blob do jsdom não tem arrayBuffer()/text() e não sobrevive ao structuredClone do
// fake-indexeddb; o Blob do Node funciona nos dois ambientes (verificado).
if (typeof Blob === "undefined" || typeof Blob.prototype.arrayBuffer !== "function") {
  globalThis.Blob = NodeBlob as unknown as typeof Blob;
}

// Sem `globals: true` o Testing Library não registra a limpeza sozinho: desmonta
// o que cada teste renderizou para o próximo começar com o DOM vazio.
if (typeof document !== "undefined") {
  const { afterEach } = await import("vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => cleanup());

  // O jsdom não tem ResizeObserver; o ResponsiveContainer do recharts precisa dele.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
