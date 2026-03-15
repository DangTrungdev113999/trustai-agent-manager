import type { ParsedFileData, WorkspaceFilename } from '@shared/types/workspace.js';
import sanitizeHtml from 'sanitize-html';
import emojiRegex from 'emoji-regex';

function sanitize(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

function validateEmoji(input: string): boolean {
  const regex = emojiRegex();
  const matches = input.match(regex);
  return matches !== null && matches.length === 1 && input === matches[0];
}

interface ParseResult {
  parsedData: ParsedFileData;
  warnings: string[];
}

// Known headings per file type
const KNOWN_HEADINGS: Record<string, string[]> = {
  'SOUL.md': ['Rules', 'Team', 'Init Project'],
  'IDENTITY.md': ['Identity'],
  'AGENTS.md': ['Session Start Checklist', 'Safety Rules', 'First Run Instructions', 'Memory Policy', 'External vs Internal', 'Group Chat Guidelines', 'Tools Notes'],
};

interface Section {
  heading: string;
  content: string;
}

function splitSections(md: string): { preamble: string; sections: Section[] } {
  const lines = md.split('\n');
  let preamble = '';
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^## (.+)$/);
    if (headingMatch) {
      if (currentHeading !== null) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n').trim(),
        });
      }
      currentHeading = headingMatch[1];
      currentLines = [];
    } else if (currentHeading === null) {
      preamble += line + '\n';
    } else {
      currentLines.push(line);
    }
  }

  if (currentHeading !== null) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join('\n').trim(),
    });
  }

  return { preamble: preamble.trim(), sections };
}

function parseNumberedList(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (match) {
      items.push(match[1]);
    }
  }
  return items;
}

function parseTeamTable(content: string): { name: string; mention: string }[] {
  const members: { name: string; mention: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip header row and separator row
    if (line.includes('---') || line.match(/^\|\s*Member\s*\|/i)) continue;
    const match = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (match) {
      const name = match[1].trim();
      const mention = match[2].trim().replace(/`/g, '');
      members.push({ name, mention });
    }
  }

  return members;
}

function parseListItems(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^-\s+(?:\[.\]\s+)?(.+)$/);
    if (match) {
      items.push(match[1]);
    }
  }
  return items;
}

function parseCodeBlock(content: string): string | undefined {
  const match = content.match(/```(?:bash)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : undefined;
}

function parseIdentityFields(content: string): { name: string; role: string; emoji: string; vibe: string } {
  const fields = { name: '', role: '', emoji: '', vibe: '' };
  for (const line of content.split('\n')) {
    const match = line.match(/^-\s+(\w+):\s+(.+)$/);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      if (key === 'name') fields.name = value;
      else if (key === 'role') fields.role = value;
      else if (key === 'emoji') fields.emoji = value;
      else if (key === 'vibe') fields.vibe = value;
    }
  }
  return fields;
}

function extractLanguage(preamble: string): string {
  // Language is the text after the first heading line (# ...)
  const lines = preamble.split('\n');
  const nonHeadingLines: string[] = [];
  for (const line of lines) {
    if (!line.startsWith('# ')) {
      nonHeadingLines.push(line);
    }
  }
  return nonHeadingLines.join('\n').trim();
}

export function parseMd(md: string, filename: WorkspaceFilename): ParsedFileData {
  const result: ParsedFileData = { freeformSections: [] };

  if (!md.trim()) return result;

  const { preamble, sections } = splitSections(md);
  const knownHeadings = KNOWN_HEADINGS[filename] ?? [];

  if (filename === 'SOUL.md') {
    const language = extractLanguage(preamble);
    result.soul = {
      language,
      rules: [],
    };

    for (const section of sections) {
      if (section.heading === 'Rules') {
        result.soul.rules = parseNumberedList(section.content);
      } else if (section.heading === 'Team') {
        result.soul.teamMembers = parseTeamTable(section.content);
      } else if (section.heading === 'Init Project') {
        result.soul.initProjectCommand = parseCodeBlock(section.content);
      } else {
        result.freeformSections.push({
          heading: section.heading,
          content: section.content,
        });
      }
    }
  } else if (filename === 'IDENTITY.md') {
    for (const section of sections) {
      if (section.heading === 'Identity') {
        result.identity = parseIdentityFields(section.content);
      } else {
        result.freeformSections.push({
          heading: section.heading,
          content: section.content,
        });
      }
    }
  } else if (filename === 'AGENTS.md') {
    result.agents = {};

    for (const section of sections) {
      if (section.heading === 'Session Start Checklist') {
        result.agents.sessionStartChecklist = parseListItems(section.content);
      } else if (section.heading === 'Safety Rules') {
        result.agents.safetyRules = parseListItems(section.content);
      } else if (section.heading === 'First Run Instructions') {
        result.agents.firstRunInstructions = section.content;
      } else if (section.heading === 'Memory Policy') {
        result.agents.memoryPolicy = section.content;
      } else if (section.heading === 'External vs Internal') {
        result.agents.externalVsInternal = section.content;
      } else if (section.heading === 'Group Chat Guidelines') {
        result.agents.groupChatGuidelines = section.content;
      } else if (section.heading === 'Tools Notes') {
        result.agents.toolsNotes = section.content;
      } else {
        result.freeformSections.push({
          heading: section.heading,
          content: section.content,
        });
      }
    }
  }

  return result;
}

export function parseMdWithWarnings(md: string, filename: WorkspaceFilename): ParseResult {
  const warnings: string[] = [];
  const { sections } = splitSections(md);
  const knownHeadings = KNOWN_HEADINGS[filename] ?? [];

  for (const section of sections) {
    if (!knownHeadings.includes(section.heading)) {
      warnings.push(`Unknown heading: ## ${section.heading}`);
    }
  }

  // Sanitize rules content (XSS prevention)
  const parsedData = parseMd(md, filename);
  sanitizeParsedData(parsedData);

  // Emoji validation for IDENTITY.md
  if (filename === 'IDENTITY.md' && parsedData.identity?.emoji) {
    if (!validateEmoji(parsedData.identity.emoji)) {
      warnings.push('Emoji must be single character');
    }
  }

  return { parsedData, warnings };
}

function sanitizeParsedData(data: ParsedFileData): void {
  if (data.soul?.rules) {
    data.soul.rules = data.soul.rules.map(sanitize);
  }
  if (data.soul?.language) {
    data.soul.language = sanitize(data.soul.language);
  }
  if (data.agents?.safetyRules) {
    data.agents.safetyRules = data.agents.safetyRules.map(sanitize);
  }
  if (data.agents?.sessionStartChecklist) {
    data.agents.sessionStartChecklist = data.agents.sessionStartChecklist.map(sanitize);
  }
  for (const section of data.freeformSections) {
    section.content = sanitize(section.content);
  }
}
