import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Download, Upload } from 'lucide-react';

export function AgentList() {
  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  });

  const agents = data ?? [];

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/agents/new"
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded"
        >
          <Plus className="h-4 w-4" />
          New Agent
        </Link>
        <button type="button" className="flex items-center gap-1 px-4 py-2 border rounded">
          <Download className="h-4 w-4" />
          Export All
        </button>
        <button type="button" className="flex items-center gap-1 px-4 py-2 border rounded">
          <Upload className="h-4 w-4" />
          Import
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : !agents.length ? (
        <p>No agents yet</p>
      ) : null}
    </div>
  );
}
