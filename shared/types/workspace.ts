export interface WorkspaceFile {
  filename: 'SOUL.md' | 'IDENTITY.md' | 'AGENTS.md';
  content: string;
  parsedData: ParsedFileData;
}

export interface ParsedFileData {
  identity?: {
    name: string;
    role: string;
    emoji: string;
    vibe: string;
  };

  soul?: {
    language: string;
    rules: string[];
    planThreadBehavior?: string;
    initProjectCommand?: string;
    milestoneWorkflow?: string;
    teamMembers?: { name: string; mention: string }[];
  };

  agents?: {
    firstRunInstructions?: string;
    sessionStartChecklist?: string[];
    memoryPolicy?: string;
    safetyRules?: string[];
    externalVsInternal?: string;
    groupChatGuidelines?: string;
    toolsNotes?: string;
  };

  freeformSections: { heading: string; content: string }[];
}

export interface WorkspaceExport {
  version: '1.0';
  files: WorkspaceFile[];
  exportedAt: string;
}

export type WorkspaceFilename = WorkspaceFile['filename'];

export const WORKSPACE_FILENAMES: readonly WorkspaceFilename[] = [
  'SOUL.md',
  'IDENTITY.md',
  'AGENTS.md',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_EXTRACTED_SIZE = 50 * 1024 * 1024; // 50MB

export interface ParseResponse {
  filename: WorkspaceFilename;
  parsedData: ParsedFileData;
  warnings: string[];
}

export interface GenerateRequest {
  filename: WorkspaceFilename;
  parsedData: ParsedFileData;
}

export interface GenerateResponse {
  filename: WorkspaceFilename;
  content: string;
}

export interface ImportResponse {
  files: WorkspaceFile[];
  warnings: string[];
}

export interface ApiError {
  error: string;
  message: string;
}
