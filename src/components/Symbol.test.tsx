import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Symbol } from './Symbol';

describe('Symbol', () => {
  it('renders symbol ID as default text when renderSymbol is not provided', () => {
    render(<Symbol symbolId="cherry" />);
    expect(screen.getByText('cherry')).toBeDefined();
  });

  it('uses renderSymbol function when provided', () => {
    const renderSymbol = (id: string) => <span data-testid="custom">{`★${id}★`}</span>;
    render(<Symbol symbolId="bell" renderSymbol={renderSymbol} />);
    expect(screen.getByTestId('custom').textContent).toBe('★bell★');
  });

  it('applies highlighted CSS class when highlighted is true', () => {
    const { container } = render(<Symbol symbolId="seven" highlighted={true} />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('reeljs-symbol--highlighted');
  });

  it('does not apply highlighted CSS class when highlighted is false', () => {
    const { container } = render(<Symbol symbolId="seven" highlighted={false} />);
    const el = container.firstElementChild!;
    expect(el.className).not.toContain('reeljs-symbol--highlighted');
  });

  it('applies custom className', () => {
    const { container } = render(<Symbol symbolId="bar" className="my-symbol" />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('my-symbol');
  });

  it('sets data-symbol-id attribute', () => {
    const { container } = render(<Symbol symbolId="cherry" />);
    const el = container.firstElementChild!;
    expect(el.getAttribute('data-symbol-id')).toBe('cherry');
  });
});
