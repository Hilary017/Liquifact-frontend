import { render } from '@testing-library/react';
import WalletStatus from '../WalletStatus';
import { ToastProvider } from '../ToastProvider';
import { axe } from 'jest-axe';

test('WalletStatus has no accessibility violations', async () => {
  const { container } = render(
    <ToastProvider>
      <WalletStatus />
    </ToastProvider>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
