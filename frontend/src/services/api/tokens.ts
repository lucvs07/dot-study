export interface TokenStore {
  get(): string | null;
  set(token: string | null): void;
}

export function memoryTokenStore(): TokenStore {
  let token: string | null = null;
  return { get: () => token, set: (t) => void (token = t) };
}

/** localStorage com fallback em memória (modo privado / storage bloqueado). */
export function browserTokenStore(key = "dotstudy:token"): TokenStore {
  const memory = memoryTokenStore();
  return {
    get() {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memory.get();
      }
    },
    set(token) {
      memory.set(token);
      try {
        if (token) window.localStorage.setItem(key, token);
        else window.localStorage.removeItem(key);
      } catch {
        // storage bloqueado: o token fica só em memória até recarregar
      }
    },
  };
}
