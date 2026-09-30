export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const PROBE_KEY = "dotstudy:probe";

/**
 * Devolve o storage do candidato se ele realmente funciona; senão (modo privado,
 * cookies bloqueados, cota zerada...) cai para um storage em memória, para o app
 * abrir mesmo sem persistência em vez de ficar com a tela em branco.
 */
export function safeStorage(candidate: () => KeyValueStorage): KeyValueStorage {
  try {
    const storage = candidate();
    storage.setItem(PROBE_KEY, "1");
    storage.getItem(PROBE_KEY);
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    console.warn("localStorage indisponível: os dados do dot.study ficarão só em memória nesta aba.");
    return createMemoryStorage();
  }
}

export function browserStorage(): KeyValueStorage {
  return safeStorage(() => window.localStorage);
}
