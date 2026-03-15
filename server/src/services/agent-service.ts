import type { AgentConfig, AgentFormData, ExportFormat, ImportResult } from '@shared/types/index.js';
import { MODEL_ALLOWLIST } from '@shared/types/index.js';
import sanitizeHtml from 'sanitize-html';
import emojiRegex from 'emoji-regex';
import * as store from './agent-store.js';

function generateId(): string {
  return crypto.randomUUID();
}

function sanitize(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

function validateEmoji(input: string): boolean {
  const regex = emojiRegex();
  const matches = input.match(regex);
  return matches !== null && matches.length === 1 && input === matches[0];
}

interface ValidationErrors {
  [field: string]: string;
}

function validateAgent(data: AgentFormData, excludeId?: string): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Name must be 100 characters or less';
  } else {
    const existing = store.findByName(data.name);
    if (existing && existing.id !== excludeId) {
      errors.name = `Agent "${data.name}" already exists`;
    }
  }

  if (!data.role || !data.role.trim()) {
    errors.role = 'Role is required';
  }

  if (!data.emoji || !data.emoji.trim()) {
    errors.emoji = 'Emoji is required';
  } else if (!validateEmoji(data.emoji)) {
    errors.emoji = 'Must be a single emoji';
  }

  if (!data.model || !data.model.trim()) {
    errors.model = 'Model is required';
  } else if (!MODEL_ALLOWLIST.includes(data.model as typeof MODEL_ALLOWLIST[number])) {
    errors.model = `Invalid model. Allowed: ${MODEL_ALLOWLIST.join(', ')}`;
  }

  if (!data.instructions || !data.instructions.trim()) {
    errors.instructions = 'Instructions is required';
  }

  return errors;
}

export function listAgents(): AgentConfig[] {
  return store.getAll();
}

export function getAgent(id: string): AgentConfig | undefined {
  return store.getById(id);
}

export function createAgent(data: AgentFormData): { agent?: AgentConfig; errors?: ValidationErrors } {
  const errors = validateAgent(data);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const now = new Date().toISOString();
  const agent: AgentConfig = {
    id: generateId(),
    name: data.name,
    role: data.role,
    emoji: data.emoji,
    model: data.model as AgentConfig['model'],
    instructions: sanitize(data.instructions),
    createdAt: now,
    updatedAt: now,
  };

  store.create(agent);
  return { agent };
}

export function updateAgent(
  id: string,
  data: AgentFormData
): { agent?: AgentConfig; errors?: ValidationErrors; notFound?: boolean; conflict?: boolean } {
  const existing = store.getById(id);
  if (!existing) return { notFound: true };

  // Conflict detection
  if (data.lastKnownUpdatedAt && data.lastKnownUpdatedAt !== existing.updatedAt) {
    return { conflict: true };
  }

  const errors = validateAgent(data, id);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const updated: AgentConfig = {
    ...existing,
    name: data.name,
    role: data.role,
    emoji: data.emoji,
    model: data.model as AgentConfig['model'],
    instructions: sanitize(data.instructions),
    updatedAt: new Date().toISOString(),
  };

  store.update(id, updated);
  return { agent: updated };
}

export function deleteAgent(id: string): boolean {
  return store.remove(id);
}

export function exportAgents(): { data?: ExportFormat; error?: string } {
  const agents = store.getAll();
  if (agents.length === 0) {
    return { error: 'No agents to export' };
  }

  return {
    data: {
      version: '1.0',
      agents,
      exportedAt: new Date().toISOString(),
    },
  };
}

export function importAgents(data: ExportFormat): { result?: ImportResult; error?: string } {
  if (!data.version || !Array.isArray(data.agents)) {
    return { error: 'Invalid import format: must include version and agents array' };
  }

  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  for (const agent of data.agents) {
    // Check duplicate ID
    if (store.getById(agent.id)) {
      result.skipped++;
      result.errors.push({ agentName: agent.name, reason: `Duplicate ID: ${agent.id}` });
      continue;
    }

    // Check duplicate name
    if (store.findByName(agent.name)) {
      result.skipped++;
      result.errors.push({ agentName: agent.name, reason: `Duplicate name: ${agent.name}` });
      continue;
    }

    // Check valid model
    if (!MODEL_ALLOWLIST.includes(agent.model as typeof MODEL_ALLOWLIST[number])) {
      result.skipped++;
      result.errors.push({ agentName: agent.name, reason: `Invalid model: ${agent.model}` });
      continue;
    }

    const now = new Date().toISOString();
    const imported: AgentConfig = {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      emoji: agent.emoji,
      model: agent.model,
      instructions: sanitize(agent.instructions),
      createdAt: now,
      updatedAt: now,
    };

    store.create(imported);
    result.imported++;
  }

  return { result };
}
