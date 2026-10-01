import { describe, expect, it } from "vitest";
import { createServices } from "./index";

describe("createServices", () => {
  it("aceita mock e api; recusa fonte desconhecida", () => {
    expect(createServices("api").auth).toBeDefined();
    expect(() => createServices("graphql")).toThrow(/VITE_DATA_SOURCE="graphql" inválido/);
  });
});
