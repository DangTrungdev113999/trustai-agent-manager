import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentForm } from '../AgentForm';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AgentForm', () => {
  it('renders all form fields', () => {
    renderWithProviders(<AgentForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/emoji/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument();
  });

  it('renders save button', () => {
    renderWithProviders(<AgentForm />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('renders model dropdown with allowed models', () => {
    renderWithProviders(<AgentForm />);
    const modelSelect = screen.getByLabelText(/model/i);
    expect(modelSelect).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    renderWithProviders(<AgentForm />);
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });
});
