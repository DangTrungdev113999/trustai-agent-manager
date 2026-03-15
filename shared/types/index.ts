export const MODEL_ALLOWLIST = [
  "gpt-4",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "claude-3-opus",
  "claude-3-sonnet",
  "claude-3-haiku",
] as const;

export type AllowedModel = (typeof MODEL_ALLOWLIST)[number];

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  emoji: string;
  model: AllowedModel;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFormData {
  name: string;
  role: string;
  emoji: string;
  model: string;
  instructions: string;
  lastKnownUpdatedAt?: string;
}

export interface ExportFormat {
  version: string;
  agents: AgentConfig[];
  exportedAt: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{
    agentName: string;
    reason: string;
  }>;
}

export interface UIState {
  loading: boolean;
  error: string | null;
  success: string | null;
}
