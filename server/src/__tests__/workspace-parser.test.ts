import { describe, it, expect } from 'vitest';
import { parseMd } from '../services/workspace-parser.js';
import type { ParsedFileData } from '@shared/types/workspace.js';

describe('parseMd', () => {
  describe('SOUL.md', () => {
    it('parses rules as numbered list items', () => {
      const md = `# Marcus — Architect @ TrustAI

Tiếng Việt (trừ code). Ngắn gọn.

## Rules
1. KHÔNG paste bash ra Discord
2. LUÔN dùng \`<@ID>\` mention
`;

      const result = parseMd(md, 'SOUL.md');

      expect(result.soul).toBeDefined();
      expect(result.soul!.language).toBe('Tiếng Việt (trừ code). Ngắn gọn.');
      expect(result.soul!.rules).toEqual([
        'KHÔNG paste bash ra Discord',
        'LUÔN dùng `<@ID>` mention',
      ]);
    });

    it('parses team members from markdown table', () => {
      const md = `# Agent

## Team
| Member | Mention |
|--------|---------|
| Marcus | \`<@1480799610283884608>\` |
| Alex   | \`<@1480799502536540323>\` |
`;

      const result = parseMd(md, 'SOUL.md');

      expect(result.soul!.teamMembers).toEqual([
        { name: 'Marcus', mention: '<@1480799610283884608>' },
        { name: 'Alex', mention: '<@1480799502536540323>' },
      ]);
    });

    it('puts unknown headings into freeformSections', () => {
      const md = `# Agent

## PLAN thread — Brainstorm
- Research trước khi review
- Alex confirm → Marcus tạo M1
`;

      const result = parseMd(md, 'SOUL.md');

      expect(result.freeformSections).toEqual([
        {
          heading: 'PLAN thread — Brainstorm',
          content: '- Research trước khi review\n- Alex confirm → Marcus tạo M1',
        },
      ]);
    });

    it('parses initProjectCommand from exec block', () => {
      const md = `# Agent

## Init Project
\`\`\`bash
npm run setup
\`\`\`
`;

      const result = parseMd(md, 'SOUL.md');
      expect(result.soul!.initProjectCommand).toBe('npm run setup');
    });
  });

  describe('IDENTITY.md', () => {
    it('parses identity fields', () => {
      const md = `# Marcus

## Identity
- Name: Marcus
- Role: Architect
- Emoji: ⚙️
- Vibe: Calm and collected
`;

      const result = parseMd(md, 'IDENTITY.md');

      expect(result.identity).toBeDefined();
      expect(result.identity!.name).toBe('Marcus');
      expect(result.identity!.role).toBe('Architect');
      expect(result.identity!.emoji).toBe('⚙️');
      expect(result.identity!.vibe).toBe('Calm and collected');
    });
  });

  describe('AGENTS.md', () => {
    it('parses session start checklist', () => {
      const md = `# Agents Config

## Session Start Checklist
- [ ] Read SOUL.md
- [ ] Check active milestones
- [ ] Review recent commits
`;

      const result = parseMd(md, 'AGENTS.md');

      expect(result.agents).toBeDefined();
      expect(result.agents!.sessionStartChecklist).toEqual([
        'Read SOUL.md',
        'Check active milestones',
        'Review recent commits',
      ]);
    });

    it('parses safety rules', () => {
      const md = `# Agents Config

## Safety Rules
- Never share API keys
- Always validate input
`;

      const result = parseMd(md, 'AGENTS.md');

      expect(result.agents!.safetyRules).toEqual([
        'Never share API keys',
        'Always validate input',
      ]);
    });
  });

  describe('edge cases', () => {
    it('returns empty freeformSections for empty file', () => {
      const result = parseMd('', 'SOUL.md');
      expect(result.freeformSections).toEqual([]);
    });

    it('preserves empty freeform section content', () => {
      const md = `# Agent

## Custom

`;

      const result = parseMd(md, 'SOUL.md');

      const custom = result.freeformSections.find(
        (s) => s.heading === 'Custom'
      );
      expect(custom).toBeDefined();
      expect(custom!.content).toBe('');
    });

    it('handles 100 freeform sections', () => {
      const sections = Array.from(
        { length: 100 },
        (_, i) => `## Custom ${i}\nContent ${i}`
      );
      const md = `# Agent\n\n${sections.join('\n\n')}`;

      const result = parseMd(md, 'SOUL.md');
      expect(result.freeformSections).toHaveLength(100);
    });
  });
});
