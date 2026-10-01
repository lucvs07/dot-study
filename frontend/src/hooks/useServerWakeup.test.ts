// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useServerWakeup } from "./useServerWakeup";

describe("useServerWakeup", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resposta rápida: nunca mostra 'acordando'", async () => {
    const ping = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useServerWakeup(ping));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.state).toBe("ready");
  });

  it("servidor lento (Render hibernando): após 2 s vira 'waking' e depois 'ready'", async () => {
    let resolve!: () => void;
    const ping = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const { result } = renderHook(() => useServerWakeup(ping));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(result.current.state).toBe("waking");
    await act(async () => {
      resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.state).toBe("ready");
  });

  it("falhas repetidas: tenta de novo a cada 5 s e desiste em 70 s; retry recomeça", async () => {
    const ping = vi.fn<() => Promise<void>>(() => Promise.reject(new Error("down")));
    const { result } = renderHook(() => useServerWakeup(ping));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(result.current.state).toBe("waking");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(70_000);
    });
    expect(result.current.state).toBe("down");
    expect(ping.mock.calls.length).toBeGreaterThanOrEqual(10);
    ping.mockImplementation(() => Promise.resolve());
    await act(async () => {
      result.current.retry();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.state).toBe("ready");
  });
});
