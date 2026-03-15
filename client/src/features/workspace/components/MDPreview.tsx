import Markdown from 'react-markdown';

interface MDPreviewProps {
  content: string;
  loading?: boolean;
  error?: string;
}

function sanitizeMarkdown(content: string): string {
  return content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[^>]*\/?>/gi, '');
}

export function MDPreview({ content, loading, error }: MDPreviewProps) {
  if (loading) {
    return (
      <div data-testid="md-preview-skeleton" className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Preview unavailable</div>;
  }

  return (
    <div className="prose max-w-none overflow-auto">
      <Markdown>{sanitizeMarkdown(content)}</Markdown>
    </div>
  );
}
