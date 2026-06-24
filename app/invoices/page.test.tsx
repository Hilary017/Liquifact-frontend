import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvoicesPage from './page';

describe('InvoicesPage', () => {
  it('renders the heading and subtext from copy.invoices', () => {
    render(<InvoicesPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/invoice/i);
    // Target specifically the subtext paragraph, not all elements containing 'upload'
    const subtext = screen.getByText(/Upload and tokenize/i);
    expect(subtext).toBeInTheDocument();
  });

  it('renders the back-link with correct href and a11y outline class', () => {
    render(<InvoicesPage />);
    const backlink = screen.getByRole('link', { name: /liquifact/i });
    expect(backlink).toHaveAttribute('href', '/');
    expect(backlink.className).toMatch(/focus-visible:outline/);
  });

  it('renders the Connect Wallet button with the correct style', () => {
    render(<InvoicesPage />);
    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toMatch(/focus-visible:outline/);
  });

  it('renders the UploadZone form and input/button by id', () => {
    render(<InvoicesPage />);
    expect(screen.getByLabelText(/drop pdf invoice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select pdf invoice file/i)).toBeInTheDocument();
    expect(document.getElementById('invoice-file-input')).toBeInTheDocument();
    expect(document.getElementById('invoice-upload-btn')).toBeInTheDocument();
  });

  // Optional: Axe accessibility smoke check
  // Uncomment if jest-axe is available in the project
  /*
  import { axe, toHaveNoViolations } from 'jest-axe';
  expect.extend(toHaveNoViolations);
  it('has no axe accessibility violations', async () => {
    const { container } = render(<InvoicesPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  */
});
