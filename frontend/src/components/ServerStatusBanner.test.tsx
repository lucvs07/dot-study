// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServerStatusBanner } from "./ServerStatusBanner";

describe("ServerStatusBanner", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mostra 'Acordando o servidor…' quando o ping demora mais de 2 s", async () => {
    const ping = vi.fn(() => new Promise<void>(() => {}));
    render(<ServerStatusBanner ping={ping} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.getByText("Acordando o servidor… (até ~1 min no plano gratuito)")).toBeInTheDocument();
  });

  it("não renderiza nada quando o ping resolve na hora", async () => {
    const ping = vi.fn(() => Promise.resolve());
    const { container } = render(<ServerStatusBanner ping={ping} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(container).toBeEmptyDOMElement();
  });
});
