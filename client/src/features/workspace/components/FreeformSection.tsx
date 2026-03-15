interface FreeformSectionProps {
  heading: string;
  content: string;
  onChange: (content: string) => void;
  defaultCollapsed?: boolean;
  showAddButton?: boolean;
}

export function FreeformSection({ heading, content, onChange }: FreeformSectionProps) {
  return <div>TODO: FreeformSection {heading}</div>;
}
