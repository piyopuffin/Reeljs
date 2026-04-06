import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Reel } from './Reel';

describe('Reel', () => {
  const symbols = ['cherry', 'bell', 'seven', 'bar', 'lemon'];

  it('renders doubled strip for seamless animation', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={false} stopPosition={0} rowCount={3} />
    );
    const track = container.querySelector('.reeljs-reel__track');
    expect(track?.children.length).toBe(symbols.length * 2);
  });

  it('applies correct transform offset for stopPosition', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={false} stopPosition={2} symbolHeight={60} rowCount={3} />
    );
    const track = container.querySelector('.reeljs-reel__track') as HTMLElement;
    expect(track.style.transform).toBe('translateY(-120px)'); // 2 * 60
  });

  it('applies spinning CSS class when spinning is true', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={true} />
    );
    const el = container.firstElementChild!;
    expect(el.className).toContain('reeljs-reel--spinning');
  });

  it('does not apply spinning CSS class when spinning is false', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={false} />
    );
    const el = container.firstElementChild!;
    expect(el.className).not.toContain('reeljs-reel--spinning');
  });

  it('sets data-spinning attribute', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={true} />
    );
    const el = container.firstElementChild!;
    expect(el.getAttribute('data-spinning')).toBe('true');
  });

  it('applies custom className and style', () => {
    const { container } = render(
      <Reel
        symbols={symbols}
        spinning={false}
        className="my-reel"
        style={{ width: '100px' }}
      />
    );
    const el = container.firstElementChild! as HTMLElement;
    expect(el.className).toContain('my-reel');
    expect(el.style.width).toBe('100px');
  });

  it('renders nothing when symbols is empty', () => {
    const { container } = render(
      <Reel symbols={[]} spinning={false} />
    );
    const track = container.querySelector('.reeljs-reel__track');
    expect(track?.children.length).toBe(0);
  });

  it('sets viewport height based on rowCount and symbolHeight', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={false} rowCount={4} symbolHeight={50} />
    );
    const el = container.firstElementChild! as HTMLElement;
    expect(el.style.height).toBe('200px'); // 4 * 50
  });

  it('uses renderSymbol when provided', () => {
    const { container } = render(
      <Reel
        symbols={symbols}
        spinning={false}
        renderSymbol={(id) => <span data-testid={`custom-${id}`}>{id.toUpperCase()}</span>}
      />
    );
    const custom = container.querySelector('[data-testid="custom-cherry"]');
    expect(custom).not.toBeNull();
    expect(custom?.textContent).toBe('CHERRY');
  });
});
