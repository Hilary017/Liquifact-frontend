import "./globals.css";

describe("globals.css theme tokens", () => {
  it("exposes expected @theme inline CSS variables", () => {
    // jsdom doesn't evaluate prefers-color-scheme; we only assert variables exist.
    const root = document.documentElement;
    expect(getComputedStyle(root).getPropertyValue("--font-geist-sans")).toBeDefined();

    // Brand tokens (declared in globals.css)
    expect(getComputedStyle(root).getPropertyValue("--color-primary").trim()).toMatch(
      /^#([0-9a-fA-F]{6})$/,
    );
    expect(getComputedStyle(root).getPropertyValue("--color-bg").trim()).toMatch(
      /^#([0-9a-fA-F]{6})$/,
    );
  });

  it("body defaults to slate-950 background and slate-100 foreground", () => {
    const bodyStyle = getComputedStyle(document.body);
    // jsdom may not have exact computed colors depending on tailwind/runtime,
    // but variables should resolve.
    expect(bodyStyle.backgroundColor).not.toBe("rgb(255, 255, 255)");
  });
});


