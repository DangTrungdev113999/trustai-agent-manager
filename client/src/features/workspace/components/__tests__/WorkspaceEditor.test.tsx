import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WorkspaceEditor } from '../WorkspaceEditor';

function renderEditor() {
  return render(
    <MemoryRouter>
      <WorkspaceEditor />
    </MemoryRouter>
  );
}

describe('WorkspaceEditor', () => {
  describe('empty state', () => {
    it('shows import placeholder when no files loaded', () => {
      renderEditor();
      expect(
        screen.getByText(/import workspace to start/i)
      ).toBeInTheDocument();
    });

    it('renders Import Workspace button', () => {
      renderEditor();
      expect(
        screen.getByRole('button', { name: /import workspace/i })
      ).toBeInTheDocument();
    });
  });

  describe('tabs', () => {
    it('renders SOUL.md, IDENTITY.md, AGENTS.md tabs', () => {
      renderEditor();
      expect(screen.getByRole('tab', { name: /soul\.md/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /identity\.md/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /agents\.md/i })).toBeInTheDocument();
    });
  });

  describe('toolbar', () => {
    it('renders Export Workspace button', () => {
      renderEditor();
      expect(
        screen.getByRole('button', { name: /export workspace/i })
      ).toBeInTheDocument();
    });
  });
});
