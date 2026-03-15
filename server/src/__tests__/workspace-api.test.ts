import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { resolve } from 'path';
import app from '../app.js';

describe('POST /api/workspace/parse', () => {
  it('parses valid SOUL.md file', async () => {
    const md = `# Marcus — Architect

## Rules
1. Rule one
2. Rule two
`;

    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from(md), 'SOUL.md');

    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('SOUL.md');
    expect(res.body.parsedData).toBeDefined();
    expect(res.body.parsedData.soul.rules).toHaveLength(2);
    expect(res.body.warnings).toEqual([]);
  });

  it('returns warnings for unknown headings', async () => {
    const md = `# Agent

## Custom Section
Some content
`;

    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from(md), 'SOUL.md');

    expect(res.status).toBe(200);
    expect(res.body.warnings).toContain('Unknown heading: ## Custom Section');
  });

  it('rejects non-.md files', async () => {
    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from('content'), 'README.txt');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_FILE');
  });

  it('rejects invalid filenames', async () => {
    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from('# Test'), 'README.md');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_FILE');
  });

  it('rejects files larger than 10MB', async () => {
    const bigContent = Buffer.alloc(11 * 1024 * 1024, 'a');

    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', bigContent, 'SOUL.md');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_FILE');
    expect(res.body.message).toContain('10MB');
  });

  it('rejects files with null bytes', async () => {
    const content = Buffer.from('# Agent\x00\x00');

    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', content, 'SOUL.md');

    expect(res.status).toBe(400);
  });

  it('handles empty file without error', async () => {
    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from(''), 'SOUL.md');

    expect(res.status).toBe(200);
    expect(res.body.parsedData.freeformSections).toEqual([]);
  });
});

describe('POST /api/workspace/generate', () => {
  it('generates markdown from parsed data', async () => {
    const res = await request(app)
      .post('/api/workspace/generate')
      .send({
        filename: 'SOUL.md',
        parsedData: {
          soul: {
            language: 'English',
            rules: ['Rule 1', 'Rule 2'],
          },
          freeformSections: [],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('SOUL.md');
    expect(res.body.content).toContain('## Rules');
    expect(res.body.content).toContain('1. Rule 1');
  });

  it('rejects invalid filename', async () => {
    const res = await request(app)
      .post('/api/workspace/generate')
      .send({
        filename: 'README.md',
        parsedData: { freeformSections: [] },
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/workspace/export', () => {
  it('exports workspace as zip', async () => {
    const res = await request(app)
      .post('/api/workspace/export')
      .send({
        files: [
          { filename: 'SOUL.md', content: '# Soul', parsedData: { freeformSections: [] } },
          { filename: 'IDENTITY.md', content: '# Identity', parsedData: { freeformSections: [] } },
          { filename: 'AGENTS.md', content: '# Agents', parsedData: { freeformSections: [] } },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/zip');
    expect(res.headers['content-disposition']).toContain('workspace-export-');
  });

  it('rejects if not all 3 files included', async () => {
    const res = await request(app)
      .post('/api/workspace/export')
      .send({
        files: [
          { filename: 'SOUL.md', content: '# Soul', parsedData: { freeformSections: [] } },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_FILE_COUNT');
    expect(res.body.message).toContain('all 3');
  });
});

describe('POST /api/workspace/import', () => {
  it('imports valid workspace zip', async () => {
    // First export to get a valid zip
    const exportRes = await request(app)
      .post('/api/workspace/export')
      .send({
        files: [
          { filename: 'SOUL.md', content: '# Soul\n\n## Rules\n1. Rule 1', parsedData: { soul: { language: '', rules: ['Rule 1'] }, freeformSections: [] } },
          { filename: 'IDENTITY.md', content: '# Identity', parsedData: { freeformSections: [] } },
          { filename: 'AGENTS.md', content: '# Agents', parsedData: { freeformSections: [] } },
        ],
      });

    expect(exportRes.status).toBe(200);

    // Then import the exported zip
    const importRes = await request(app)
      .post('/api/workspace/import')
      .attach('file', exportRes.body as Buffer, 'workspace.zip');

    expect(importRes.status).toBe(200);
    expect(importRes.body.files).toHaveLength(3);
    expect(importRes.body.warnings).toEqual([]);
  });

  it('rejects zip missing required files', async () => {
    // Create a minimal zip with only 1 file
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    zip.addFile('SOUL.md', Buffer.from('# Soul'));
    const zipBuffer = zip.toBuffer();

    const res = await request(app)
      .post('/api/workspace/import')
      .attach('file', zipBuffer, 'workspace.zip');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ZIP');
  });

  it('rejects oversized zip', async () => {
    const bigZip = Buffer.alloc(11 * 1024 * 1024, 0);

    const res = await request(app)
      .post('/api/workspace/import')
      .attach('file', bigZip, 'workspace.zip');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_FILE');
  });

  it('rejects path traversal in zip entries', async () => {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    zip.addFile('../../../etc/passwd', Buffer.from('root:x:0:0'));
    zip.addFile('SOUL.md', Buffer.from('# Soul'));
    zip.addFile('IDENTITY.md', Buffer.from('# Identity'));
    zip.addFile('AGENTS.md', Buffer.from('# Agents'));
    const zipBuffer = zip.toBuffer();

    const res = await request(app)
      .post('/api/workspace/import')
      .attach('file', zipBuffer, 'workspace.zip');

    expect(res.status).toBe(200);
    expect(res.body.warnings).toContain('Invalid filename: ../../../etc/passwd');
  });

  it('rejects non-zip files', async () => {
    const res = await request(app)
      .post('/api/workspace/import')
      .attach('file', Buffer.from('not a zip'), 'workspace.zip');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ZIP');
  });
});

describe('XSS prevention', () => {
  it('sanitizes script tags in parsed markdown', async () => {
    const md = `# Agent

## Rules
1. <script>alert('xss')</script>Safe rule
`;

    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from(md), 'SOUL.md');

    expect(res.status).toBe(200);
    const rules = res.body.parsedData.soul.rules;
    expect(rules[0]).not.toContain('<script>');
    expect(rules[0]).toContain('Safe rule');
  });
});

describe('roundtrip: parse → generate', () => {
  it('preserves data through parse → generate cycle', async () => {
    const originalMd = `# Marcus — Architect @ TrustAI

Tiếng Việt (trừ code). Ngắn gọn.

## Rules
1. KHÔNG paste bash ra Discord
2. LUÔN dùng \`<@ID>\` mention

## PLAN thread — Brainstorm
- Research trước khi review
- Alex confirm → Marcus tạo M1
`;

    // Parse
    const parseRes = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from(originalMd), 'SOUL.md');

    expect(parseRes.status).toBe(200);

    // Generate
    const genRes = await request(app)
      .post('/api/workspace/generate')
      .send({
        filename: 'SOUL.md',
        parsedData: parseRes.body.parsedData,
      });

    expect(genRes.status).toBe(200);
    expect(genRes.body.content).toContain('KHÔNG paste bash ra Discord');
    expect(genRes.body.content).toContain('PLAN thread — Brainstorm');
    expect(genRes.body.content).toContain('Research trước khi review');
  });
});

describe('emoji validation', () => {
  it('warns on multiple emojis in IDENTITY.md', async () => {
    const md = `# Agent

## Identity
- Name: Marcus
- Role: Architect
- Emoji: 🔥🔥
- Vibe: Energetic
`;

    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from(md), 'IDENTITY.md');

    expect(res.status).toBe(200);
    expect(res.body.warnings).toContain('Emoji must be single character');
  });

  it('accepts multi-codepoint single emoji', async () => {
    const md = `# Agent

## Identity
- Name: Marcus
- Role: Architect
- Emoji: 👨‍👩‍👧‍👦
- Vibe: Family
`;

    const res = await request(app)
      .post('/api/workspace/parse')
      .attach('file', Buffer.from(md), 'IDENTITY.md');

    expect(res.status).toBe(200);
    expect(res.body.warnings).not.toContain('Emoji must be single character');
  });
});
