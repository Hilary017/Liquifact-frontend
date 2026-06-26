import { render } from "@testing-library/react";
import { ToastProvider } from "../ToastProvider";
import WalletStatus from "../WalletStatus";
import { axe } from "jest-axe";

test.skip('WalletStatus has no accessibility violations', async () => {
  const { container } = render(
    <ToastProvider>
      <WalletStatus />
    </ToastProvider>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
