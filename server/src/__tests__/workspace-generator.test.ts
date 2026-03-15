import { describe, it, expect } from 'vitest';
import { generateMd } from '../services/workspace-generator.js';
import type { ParsedFileData } from '@shared/types/workspace.js';

describe('generateMd', () => {
  it('generates SOUL.md with rules as numbered list', () => {
    const data: ParsedFileData = {
      soul: {
        language: 'Tiếng Việt',
        rules: ['Rule 1', 'Rule 2'],
      },
      freeformSections: [],
    };

    const result = generateMd(data, 'SOUL.md');

    expect(result).toContain('## Rules');
    expect(result).toContain('1. Rule 1');
    expect(result).toContain('2. Rule 2');
  });

  it('appends freeform sections as-is', () => {
    const data: ParsedFileData = {
      freeformSections: [
        {
          heading: 'PLAN thread — Brainstorm',
          content: '- Research trước khi review\n- Alex confirm → Marcus tạo M1',
        },
      ],
    };

    const result = generateMd(data, 'SOUL.md');

    expect(result).toContain('## PLAN thread — Brainstorm');
    expect(result).toContain('- Research trước khi review');
    expect(result).toContain('- Alex confirm → Marcus tạo M1');
  });

  it('generates empty string for empty data', () => {
    const data: ParsedFileData = {
      freeformSections: [],
    };

    const result = generateMd(data, 'SOUL.md');
    expect(result.trim()).toBe('');
  });

  it('generates IDENTITY.md with identity fields', () => {
    const data: ParsedFileData = {
      identity: {
        name: 'Marcus',
        role: 'Architect',
        emoji: '⚙️',
        vibe: 'Calm and collected',
      },
      freeformSections: [],
    };

    const result = generateMd(data, 'IDENTITY.md');

    expect(result).toContain('Marcus');
    expect(result).toContain('Architect');
    expect(result).toContain('⚙️');
    expect(result).toContain('Calm and collected');
  });

  it('generates AGENTS.md with session start checklist', () => {
    const data: ParsedFileData = {
      agents: {
        sessionStartChecklist: ['Read SOUL.md', 'Check milestones'],
        safetyRules: ['Never share keys'],
      },
      freeformSections: [],
    };

    const result = generateMd(data, 'AGENTS.md');

    expect(result).toContain('Read SOUL.md');
    expect(result).toContain('Check milestones');
    expect(result).toContain('Never share keys');
  });

  it('generates team members as markdown table', () => {
    const data: ParsedFileData = {
      soul: {
        language: 'English',
        rules: [],
        teamMembers: [
          { name: 'Marcus', mention: '<@1480799610283884608>' },
          { name: 'Alex', mention: '<@1480799502536540323>' },
        ],
      },
      freeformSections: [],
    };

    const result = generateMd(data, 'SOUL.md');

    expect(result).toContain('## Team');
    expect(result).toContain('Marcus');
    expect(result).toContain('<@1480799610283884608>');
  });

  it('adds blank line between sections', () => {
    const data: ParsedFileData = {
      soul: {
        language: 'English',
        rules: ['Rule 1'],
      },
      freeformSections: [
        { heading: 'Custom', content: 'Custom content' },
      ],
    };

    const result = generateMd(data, 'SOUL.md');

    // Should have blank line between Rules section and Custom section
    expect(result).toMatch(/Rule 1\n\n## Custom/);
  });
});
