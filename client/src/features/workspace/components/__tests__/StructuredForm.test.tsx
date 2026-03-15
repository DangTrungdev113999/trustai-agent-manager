import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StructuredForm } from '../StructuredForm';
import type { ParsedFileData } from '@shared/types/workspace';

function renderForm(props: {
  filename: 'SOUL.md' | 'IDENTITY.md' | 'AGENTS.md';
  data: ParsedFileData;
  onChange: (data: ParsedFileData) => void;
}) {
  return render(
    <MemoryRouter>
      <StructuredForm {...props} />
    </MemoryRouter>
  );
}

describe('StructuredForm', () => {
  describe('SOUL.md form', () => {
    it('renders language input field', () => {
      renderForm({
        filename: 'SOUL.md',
        data: {
          soul: { language: 'English', rules: [] },
          freeformSections: [],
        },
        onChange: () => {},
      });

      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('English')).toBeInTheDocument();
    });

    it('renders rules as editable list', () => {
      renderForm({
        filename: 'SOUL.md',
        data: {
          soul: { language: 'English', rules: ['Rule 1', 'Rule 2'] },
          freeformSections: [],
        },
        onChange: () => {},
      });

      expect(screen.getByDisplayValue('Rule 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rule 2')).toBeInTheDocument();
    });

    it('renders team members fields', () => {
      renderForm({
        filename: 'SOUL.md',
        data: {
          soul: {
            language: 'English',
            rules: [],
            teamMembers: [
              { name: 'Marcus', mention: '<@123>' },
            ],
          },
          freeformSections: [],
        },
        onChange: () => {},
      });

      expect(screen.getByDisplayValue('Marcus')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<@123>')).toBeInTheDocument();
    });
  });

  describe('IDENTITY.md form', () => {
    it('renders identity fields', () => {
      renderForm({
        filename: 'IDENTITY.md',
        data: {
          identity: {
            name: 'Marcus',
            role: 'Architect',
            emoji: '⚙️',
            vibe: 'Calm',
          },
          freeformSections: [],
        },
        onChange: () => {},
      });

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Marcus')).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/emoji/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vibe/i)).toBeInTheDocument();
    });

    it('shows validation error for invalid emoji', () => {
      renderForm({
        filename: 'IDENTITY.md',
        data: {
          identity: {
            name: 'Marcus',
            role: 'Architect',
            emoji: '🔥🔥',
            vibe: 'Calm',
          },
          freeformSections: [],
        },
        onChange: () => {},
      });

      expect(screen.getByText(/emoji must be/i)).toBeInTheDocument();
    });
  });

  describe('AGENTS.md form', () => {
    it('renders session start checklist', () => {
      renderForm({
        filename: 'AGENTS.md',
        data: {
          agents: {
            sessionStartChecklist: ['Read SOUL.md', 'Check milestones'],
          },
          freeformSections: [],
        },
        onChange: () => {},
      });

      expect(screen.getByDisplayValue('Read SOUL.md')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Check milestones')).toBeInTheDocument();
    });

    it('renders safety rules', () => {
      renderForm({
        filename: 'AGENTS.md',
        data: {
          agents: {
            safetyRules: ['Never share API keys'],
          },
          freeformSections: [],
        },
        onChange: () => {},
      });

      expect(screen.getByDisplayValue('Never share API keys')).toBeInTheDocument();
    });
  });
});
