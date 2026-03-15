import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface FreeformSectionProps {
  heading: string;
  content: string;
  onChange: (content: string) => void;
  defaultCollapsed?: boolean;
  showAddButton?: boolean;
  onAddSection?: () => void;
}

export function FreeformSection({
  heading,
  content,
  onChange,
  defaultCollapsed = false,
  showAddButton = false,
  onAddSection,
}: FreeformSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="border rounded-lg p-4">
      <button
        type="button"
        className="flex items-center gap-2 font-medium w-full text-left"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {heading}
      </button>

      {!collapsed && (
        <textarea
          className="mt-2 w-full min-h-[100px] border rounded p-2"
          value={content}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {showAddButton && (
        <button
          type="button"
          className="mt-2 flex items-center gap-1 text-sm"
          onClick={onAddSection}
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      )}
    </div>
  );
}
