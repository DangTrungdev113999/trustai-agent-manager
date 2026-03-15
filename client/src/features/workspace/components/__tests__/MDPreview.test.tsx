import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MDPreview } from '../MDPreview';

describe('MDPreview', () => {
  it('renders markdown content', () => {
    render(
      <MemoryRouter>
        <MDPreview content="# Hello World" />
      </MemoryRouter>
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    render(
      <MemoryRouter>
        <MDPreview content="" loading />
      </MemoryRouter>
    );

    expect(screen.getByTestId('md-preview-skeleton')).toBeInTheDocument();
  });

  it('renders error message on error', () => {
    render(
      <MemoryRouter>
        <MDPreview content="" error="Generation failed" />
      </MemoryRouter>
    );

    expect(screen.getByText(/preview unavailable/i)).toBeInTheDocument();
  });

  it('does not render script tags (XSS prevention)', () => {
    render(
      <MemoryRouter>
        <MDPreview content="<script>alert('xss')</script>Safe text" />
      </MemoryRouter>
    );

    expect(screen.getByText('Safe text')).toBeInTheDocument();
    expect(screen.queryByText("alert('xss')")).not.toBeInTheDocument();
  });

  it('does not render iframe tags', () => {
    render(
      <MemoryRouter>
        <MDPreview content='<iframe src="evil.com"></iframe>Safe text' />
      </MemoryRouter>
    );

    expect(screen.getByText('Safe text')).toBeInTheDocument();
    const iframes = document.querySelectorAll('iframe');
    expect(iframes).toHaveLength(0);
  });
});
