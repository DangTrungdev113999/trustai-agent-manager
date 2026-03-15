import type { AgentConfig } from '@shared/types/index.js';

let agents: Map<string, AgentConfig> = new Map();

export function getAll(): AgentConfig[] {
  return Array.from(agents.values());
}

export function getById(id: string): AgentConfig | undefined {
  return agents.get(id);
}

export function create(agent: AgentConfig): void {
  agents.set(agent.id, agent);
}

export function update(id: string, agent: AgentConfig): void {
  agents.set(id, agent);
}

export function remove(id: string): boolean {
  return agents.delete(id);
}

export function findByName(name: string): AgentConfig | undefined {
  const lower = name.toLowerCase();
  for (const agent of agents.values()) {
    if (agent.name.toLowerCase() === lower) return agent;
  }
  return undefined;
}

export function reset(): void {
  agents = new Map();
}
