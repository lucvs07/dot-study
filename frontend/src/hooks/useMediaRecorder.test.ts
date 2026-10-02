// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaRecorder } from "./useMediaRecorder";

class FakeRecorder {
  static isTypeSupported = () => true;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(
    public stream: MediaStream,
    public options?: MediaRecorderOptions,
  ) {}
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["x"], { type: "audio/webm" }) });
    this.onstop?.();
  }
}

function fakeStream(): MediaStream {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
}

describe("useMediaRecorder", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("grava e produz blob", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream()) },
    });
    URL.createObjectURL = vi.fn(() => "blob:preview");
    const { result } = renderHook(() => useMediaRecorder("audio"));
    await act(() => result.current.start());
    expect(result.current.status).toBe("recording");
    act(() => result.current.stop());
    expect(result.current.status).toBe("recorded");
    expect(result.current.blob?.type).toBe("audio/webm");
  });

  it("permissão negada vira mensagem em pt-BR", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error("denied"), { name: "NotAllowedError" })),
      },
    });
    const { result } = renderHook(() => useMediaRecorder("audio"));
    await act(() => result.current.start());
    expect(result.current.status).toBe("error");
    expect(result.current.error).toMatch(/permita o acesso ao microfone/i);
  });

  it("navegador sem MediaRecorder", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const { result } = renderHook(() => useMediaRecorder("video"));
    await act(() => result.current.start());
    expect(result.current.error).toMatch(/não permite gravar/i);
  });

  it("desmontar enquanto pede permissão solta o dispositivo e não grava", async () => {
    const constructed = vi.fn();
    class SpyRecorder extends FakeRecorder {
      constructor(stream: MediaStream) {
        super(stream);
        constructed();
      }
    }
    vi.stubGlobal("MediaRecorder", SpyRecorder);
    let grant!: (s: MediaStream) => void;
    const pending = new Promise<MediaStream>((resolve) => (grant = resolve));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(() => pending) },
    });
    const trackStop = vi.fn();
    const { result, unmount } = renderHook(() => useMediaRecorder("video"));
    let started!: Promise<void>;
    act(() => {
      started = result.current.start();
    });
    expect(result.current.status).toBe("requesting");
    unmount();
    grant({ getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream);
    await started;
    expect(trackStop).toHaveBeenCalled();
    expect(constructed).not.toHaveBeenCalled();
  });
});
