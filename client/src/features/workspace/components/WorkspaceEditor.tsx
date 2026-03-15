import { Upload, Download } from 'lucide-react';

export function WorkspaceEditor() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div role="tablist" className="flex gap-1">
          <button role="tab" type="button" className="px-4 py-2 rounded font-medium">
            SOUL.md
          </button>
          <button role="tab" type="button" className="px-4 py-2 rounded font-medium">
            IDENTITY.md
          </button>
          <button role="tab" type="button" className="px-4 py-2 rounded font-medium">
            AGENTS.md
          </button>
        </div>

        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-2 px-4 py-2 border rounded">
            <Upload className="h-4 w-4" />
            Import Workspace
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border rounded">
            <Download className="h-4 w-4" />
            Export Workspace
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Import workspace to start</p>
      </div>
    </div>
  );
}
