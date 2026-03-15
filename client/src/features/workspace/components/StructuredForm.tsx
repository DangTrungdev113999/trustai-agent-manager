import type { ParsedFileData } from '@shared/types/workspace';

interface StructuredFormProps {
  filename: 'SOUL.md' | 'IDENTITY.md' | 'AGENTS.md';
  data: ParsedFileData;
  onChange: (data: ParsedFileData) => void;
}

export function StructuredForm({ filename, data, onChange }: StructuredFormProps) {
  return <div>TODO: StructuredForm for {filename}</div>;
}
