import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ModePicker, PalettePicker } from "@/components/ThemeToggle";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset["palette"];
});

describe("Settings interactions", () => {
  it("applies and remembers light, dark, and system choices", () => {
    render(<ModePicker />);
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    fireEvent.click(screen.getByRole("radio", { name: "Light" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
    fireEvent.click(screen.getByRole("radio", { name: "System" }));
    expect(localStorage.getItem("theme")).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies every palette and restores Sunrise", () => {
    render(<PalettePicker />);
    for (const palette of ["ocean", "forest", "citrus", "rose", "lagoon", "plum", "ember", "glacier", "graphite", "mint", "sunflower"]) {
      fireEvent.click(screen.getByRole("button", { name: palette }));
      expect(document.documentElement.dataset["palette"]).toBe(palette);
      expect(localStorage.getItem("palette")).toBe(palette);
    }
    fireEvent.click(screen.getByRole("button", { name: "sunrise" }));
    expect(document.documentElement.dataset["palette"]).toBeUndefined();
    expect(localStorage.getItem("palette")).toBe("sunrise");
  });
});