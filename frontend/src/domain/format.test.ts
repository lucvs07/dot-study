import { describe, expect, it } from "vitest";
import { formatRecTime, formatTotalTime, getDateLabel, relativeTime } from "./format";

const now = new Date(2026, 8, 29, 12, 0, 0).getTime();

describe("format", () => {
  it("formatTotalTime", () => {
    expect(formatTotalTime(45)).toBe("45min");
    expect(formatTotalTime(120)).toBe("2h");
    expect(formatTotalTime(135)).toBe("2h 15min");
  });
  it("formatRecTime", () => {
    expect(formatRecTime(134)).toBe("02:14");
  });
  it("getDateLabel", () => {
    expect(getDateLabel(new Date(2026, 8, 29, 8), now)).toBe("Hoje");
    expect(getDateLabel(new Date(2026, 8, 28, 8), now)).toBe("Ontem");
    expect(getDateLabel(new Date(2026, 8, 25, 8), now)).toBe("Esta semana");
  });
  it("relativeTime", () => {
    expect(relativeTime(new Date(now - 20_000).toISOString(), now)).toBe("agora");
    expect(relativeTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe("há 5 min");
    expect(relativeTime(new Date(now - 2 * 3_600_000).toISOString(), now)).toBe("há 2h");
    expect(relativeTime(new Date(now - 26 * 3_600_000).toISOString(), now)).toBe("há 1d");
  });
});
