// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date("2026-09-29T12:00:00Z") }));
  afterEach(() => vi.useRealTimers());

  it("conta regressivamente e chama onFinish uma vez", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useCountdown(onFinish));
    act(() => result.current.start(3));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("aba em segundo plano: se o relógio pula, termina na hora certa", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useCountdown(onFinish));
    act(() => result.current.start(25 * 60));
    // intervalos estrangulados: o relógio anda 25 min, mas só um tick dispara
    act(() => {
      vi.setSystemTime(new Date("2026-09-29T12:25:01Z"));
      vi.advanceTimersByTime(250);
    });
    expect(result.current.secondsLeft).toBe(0);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("pausa e retoma sem perder tempo", () => {
    const { result } = renderHook(() => useCountdown(() => {}));
    act(() => result.current.start(10));
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.secondsLeft).toBe(6);
    act(() => result.current.resume());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(4);
  });
});
