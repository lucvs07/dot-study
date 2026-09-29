// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotAvatar } from "./DotAvatar";

describe("DotAvatar", () => {
  it("renderiza com e sem acessório", () => {
    const { container, rerender } = render(<DotAvatar color="#22CFD5" size={48} />);
    expect(container.querySelector("svg")).not.toBeNull();
    rerender(<DotAvatar color="#22CFD5" accessory="glasses" size={48} />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});
