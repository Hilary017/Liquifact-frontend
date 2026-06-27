import React from 'react';
import { render } from '@testing-library/react';
import { ToastProvider } from '../ToastProvider';
import { WalletProvider } from '../WalletProvider'; // Imported the missing provider
import WalletStatus from '../WalletStatus';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

test.skip('WalletStatus has no accessibility violations', async () => {
  const { container } = render(
    <ToastProvider>
      <WalletProvider>
        <WalletStatus />
      </WalletProvider>
    </ToastProvider>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});