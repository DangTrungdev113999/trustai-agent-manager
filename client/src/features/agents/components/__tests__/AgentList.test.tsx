import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentList } from '../AgentList';

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

describe('AgentList', () => {
  it('renders loading state', () => {
    renderWithProviders(<AgentList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders empty state when no agents', async () => {
    renderWithProviders(<AgentList />);
    expect(
      await screen.findByText(/no agents yet/i),
    ).toBeInTheDocument();
  });

  it('renders new agent button', () => {
    renderWithProviders(<AgentList />);
    expect(screen.getByRole('link', { name: /new agent/i })).toBeInTheDocument();
  });

  it('renders export all button', () => {
    renderWithProviders(<AgentList />);
    expect(screen.getByRole('button', { name: /export all/i })).toBeInTheDocument();
  });

  it('renders import button', () => {
    renderWithProviders(<AgentList />);
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });
});
