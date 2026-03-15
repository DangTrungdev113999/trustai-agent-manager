import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import type { AgentConfig, ExportFormat, ImportResult } from '@shared/types/index.js';

describe('GET /api/agents', () => {
  it('returns empty list initially', async () => {
    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ agents: [] });
  });

  it('returns all agents after creation', async () => {
    await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.body.agents).toHaveLength(1);
    expect(res.body.agents[0].name).toBe('Marcus');
  });
});

describe('GET /api/agents/:id', () => {
  it('returns agent by id', async () => {
    const create = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });
    const id = create.body.id;

    const res = await request(app).get(`/api/agents/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Marcus');
    expect(res.body.id).toBe(id);
  });

  it('returns 404 for non-existent agent', async () => {
    const res = await request(app).get('/api/agents/non-existent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Agent not found');
  });
});

describe('POST /api/agents', () => {
  it('creates agent with valid data', async () => {
    const res = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Marcus');
    expect(res.body.role).toBe('Tech Lead');
    expect(res.body.emoji).toBe('⚙️');
    expect(res.body.model).toBe('gpt-4');
    expect(res.body.instructions).toBe('Lead the team');
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/agents').send({
      name: '',
      role: '',
      emoji: '',
      model: '',
      instructions: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
  });

  it('rejects name longer than 100 chars', async () => {
    const res = await request(app).post('/api/agents').send({
      name: 'a'.repeat(101),
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.name).toBeDefined();
  });

  it('rejects duplicate name (case-insensitive)', async () => {
    await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    const res = await request(app).post('/api/agents').send({
      name: 'marcus',
      role: 'Developer',
      emoji: '🔥',
      model: 'gpt-4',
      instructions: 'Code stuff',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.name).toContain('already exists');
  });

  it('rejects invalid model', async () => {
    const res = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-99',
      instructions: 'Lead the team',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.model).toBeDefined();
  });

  it('rejects invalid emoji (text + emoji)', async () => {
    const res = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: 'Marcus ⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.emoji).toBeDefined();
  });

  it('rejects multiple emojis', async () => {
    const res = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '🔥🔥',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.emoji).toBeDefined();
  });

  it('accepts multi-codepoint single emoji', async () => {
    const res = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '👨‍👩‍👧‍👦',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    expect(res.status).toBe(201);
    expect(res.body.emoji).toBe('👨‍👩‍👧‍👦');
  });

  it('sanitizes HTML/script tags', async () => {
    const res = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: '<script>alert("xss")</script>Hello',
    });

    expect(res.status).toBe(201);
    expect(res.body.instructions).not.toContain('<script>');
    expect(res.body.instructions).toContain('Hello');
  });
});

describe('PUT /api/agents/:id', () => {
  it('updates agent with valid data', async () => {
    const create = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });
    const id = create.body.id;

    const res = await request(app).put(`/api/agents/${id}`).send({
      name: 'Marcus Updated',
      role: 'Senior Lead',
      emoji: '🔥',
      model: 'gpt-4-turbo',
      instructions: 'Lead the team v2',
    });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Marcus Updated');
    expect(res.body.role).toBe('Senior Lead');
  });

  it('returns 404 for non-existent agent', async () => {
    const res = await request(app).put('/api/agents/non-existent').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    expect(res.status).toBe(404);
  });

  it('detects conflict via lastKnownUpdatedAt', async () => {
    const create = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });
    const id = create.body.id;
    const originalUpdatedAt = create.body.updatedAt;

    // First update succeeds
    await request(app).put(`/api/agents/${id}`).send({
      name: 'Marcus v2',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team v2',
    });

    // Second update with stale lastKnownUpdatedAt should conflict
    const res = await request(app).put(`/api/agents/${id}`).send({
      name: 'Marcus v3',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team v3',
      lastKnownUpdatedAt: originalUpdatedAt,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('modified');
  });

  it('skips conflict check when no lastKnownUpdatedAt (overwrite)', async () => {
    const create = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });
    const id = create.body.id;

    // Update without lastKnownUpdatedAt should always succeed
    const res = await request(app).put(`/api/agents/${id}`).send({
      name: 'Marcus Overwritten',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Overwritten',
    });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Marcus Overwritten');
  });
});

describe('DELETE /api/agents/:id', () => {
  it('deletes existing agent', async () => {
    const create = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });
    const id = create.body.id;

    const res = await request(app).delete(`/api/agents/${id}`);
    expect(res.status).toBe(204);

    const get = await request(app).get(`/api/agents/${id}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for non-existent agent', async () => {
    const res = await request(app).delete('/api/agents/non-existent');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/agents/export', () => {
  it('exports all agents', async () => {
    await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });
    await request(app).post('/api/agents').send({
      name: 'Alex',
      role: 'Developer',
      emoji: '🔥',
      model: 'claude-3-sonnet',
      instructions: 'Write code',
    });

    const res = await request(app).post('/api/agents/export').send({});
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('1.0');
    expect(res.body.agents).toHaveLength(2);
    expect(res.body.exportedAt).toBeDefined();
  });

  it('returns 400 when no agents to export', async () => {
    const res = await request(app).post('/api/agents/export').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No agents');
  });
});

describe('POST /api/agents/import', () => {
  it('imports valid agents', async () => {
    const importData: ExportFormat = {
      version: '1.0',
      agents: [
        {
          id: 'import-1',
          name: 'Imported Agent',
          role: 'Tester',
          emoji: '🧪',
          model: 'gpt-4',
          instructions: 'Test things',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      exportedAt: '2026-03-15T00:00:00Z',
    };

    const res = await request(app).post('/api/agents/import').send(importData);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(0);
    expect(res.body.errors).toHaveLength(0);

    // Verify agent exists with preserved ID
    const get = await request(app).get('/api/agents/import-1');
    expect(get.status).toBe(200);
    expect(get.body.name).toBe('Imported Agent');
    // Timestamps should be regenerated
    expect(get.body.createdAt).not.toBe('2026-01-01T00:00:00Z');
  });

  it('skips agents with duplicate names', async () => {
    await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });

    const importData: ExportFormat = {
      version: '1.0',
      agents: [
        {
          id: 'import-dup',
          name: 'marcus',
          role: 'Duplicate',
          emoji: '🔥',
          model: 'gpt-4',
          instructions: 'Duplicate',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      exportedAt: '2026-03-15T00:00:00Z',
    };

    const res = await request(app).post('/api/agents/import').send(importData);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(0);
    expect(res.body.skipped).toBe(1);
    expect(res.body.errors[0]!.reason).toContain('Duplicate name');
  });

  it('skips agents with duplicate IDs', async () => {
    const create = await request(app).post('/api/agents').send({
      name: 'Marcus',
      role: 'Tech Lead',
      emoji: '⚙️',
      model: 'gpt-4',
      instructions: 'Lead the team',
    });
    const existingId = create.body.id;

    const importData: ExportFormat = {
      version: '1.0',
      agents: [
        {
          id: existingId,
          name: 'Different Name',
          role: 'Tester',
          emoji: '🧪',
          model: 'gpt-4',
          instructions: 'Test',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      exportedAt: '2026-03-15T00:00:00Z',
    };

    const res = await request(app).post('/api/agents/import').send(importData);
    expect(res.status).toBe(200);
    expect(res.body.skipped).toBe(1);
    expect(res.body.errors[0]!.reason).toContain('Duplicate ID');
  });

  it('skips agents with invalid model', async () => {
    const importData: ExportFormat = {
      version: '1.0',
      agents: [
        {
          id: 'import-bad-model',
          name: 'Bad Model Agent',
          role: 'Tester',
          emoji: '🧪',
          model: 'gpt-99' as AgentConfig['model'],
          instructions: 'Test',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      exportedAt: '2026-03-15T00:00:00Z',
    };

    const res = await request(app).post('/api/agents/import').send(importData);
    expect(res.status).toBe(200);
    expect(res.body.skipped).toBe(1);
    expect(res.body.errors[0]!.reason).toContain('Invalid model');
  });

  it('rejects invalid import format', async () => {
    const res = await request(app).post('/api/agents/import').send({
      agents: [],
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid import format');
  });

  it('round-trip: export then import preserves IDs', async () => {
    // Create agents
    const a1 = await request(app).post('/api/agents').send({
      name: 'Agent A',
      role: 'Role A',
      emoji: '🅰️',
      model: 'gpt-4',
      instructions: 'Instructions A',
    });
    const a2 = await request(app).post('/api/agents').send({
      name: 'Agent B',
      role: 'Role B',
      emoji: '🅱️',
      model: 'claude-3-sonnet',
      instructions: 'Instructions B',
    });

    // Export
    const exportRes = await request(app).post('/api/agents/export').send({});
    expect(exportRes.status).toBe(200);
    const exported = exportRes.body as ExportFormat;

    // Delete all
    await request(app).delete(`/api/agents/${a1.body.id}`);
    await request(app).delete(`/api/agents/${a2.body.id}`);

    // Verify empty
    const empty = await request(app).get('/api/agents');
    expect(empty.body.agents).toHaveLength(0);

    // Import
    const importRes = await request(app).post('/api/agents/import').send(exported);
    expect(importRes.status).toBe(200);
    expect(importRes.body.imported).toBe(2);

    // Verify IDs preserved
    const getA = await request(app).get(`/api/agents/${a1.body.id}`);
    expect(getA.status).toBe(200);
    expect(getA.body.name).toBe('Agent A');

    const getB = await request(app).get(`/api/agents/${a2.body.id}`);
    expect(getB.status).toBe(200);
    expect(getB.body.name).toBe('Agent B');
  });

  it('sanitizes HTML/script tags in imported agents', async () => {
    const importData: ExportFormat = {
      version: '1.0',
      agents: [
        {
          id: 'import-xss',
          name: 'XSS Agent',
          role: 'Tester',
          emoji: '🧪',
          model: 'gpt-4',
          instructions: '<script>alert("xss")</script>Safe content',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      exportedAt: '2026-03-15T00:00:00Z',
    };

    const res = await request(app).post('/api/agents/import').send(importData);
    expect(res.status).toBe(200);

    const get = await request(app).get('/api/agents/import-xss');
    expect(get.body.instructions).not.toContain('<script>');
    expect(get.body.instructions).toContain('Safe content');
  });
});
