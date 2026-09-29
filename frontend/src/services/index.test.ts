import { describe, expect, it } from "vitest";
import { createServices } from "./index";

describe("createServices", () => {
  it("recusa fonte desconhecida com mensagem clara", () => {
    expect(() => createServices("api")).toThrow(/ainda não está disponível/);
  });
});
