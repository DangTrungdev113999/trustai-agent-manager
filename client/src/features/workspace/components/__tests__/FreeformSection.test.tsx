import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FreeformSection } from '../FreeformSection';

describe('FreeformSection', () => {
  it('renders textarea with section content', () => {
    render(
      <MemoryRouter>
        <FreeformSection
          heading="Custom Section"
          content="Some content here"
          onChange={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Section')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Some content here')).toBeInTheDocument();
  });

  it('renders as collapsible section', () => {
    render(
      <MemoryRouter>
        <FreeformSection
          heading="Collapsible"
          content="Hidden content"
          onChange={() => {}}
          defaultCollapsed
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Collapsible')).toBeInTheDocument();
  });

  it('renders Add Section button', () => {
    render(
      <MemoryRouter>
        <FreeformSection
          heading="Section"
          content=""
          onChange={() => {}}
          showAddButton
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('button', { name: /add section/i })
    ).toBeInTheDocument();
  });
});
