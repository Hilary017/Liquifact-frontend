import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

import "./globals.css";

expect.extend(toHaveNoViolations);

function ContrastFixture() {
  return (
    <div className="bg-slate-950 text-slate-100 p-4">
      <p data-testid="body-text" className="text-slate-100">
        Body text
      </p>
      <p data-testid="muted-text" className="text-slate-400">
        Muted text
      </p>
    </div>
  );
}

describe("globals.css theming + WCAG contrast smoke", () => {
  it("has no basic axe accessibility violations in a dark-themed fixture", async () => {
    const { container } = render(<ContrastFixture />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

