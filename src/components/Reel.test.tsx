import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Reel } from './Reel';

describe('Reel', () => {
  const symbols = ['cherry', 'bell', 'seven', 'bar', 'lemon'];

  it('renders visible symbols based on stopPosition', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={false} stopPosition={0} rowCount={3} />
    );
    const symbolEls = container.querySelectorAll('.reeljs-symbol');
    expect(symbolEls.length).toBe(3);
    expect(symbolEls[0].getAttribute('data-symbol-id')).toBe('cherry');
    expect(symbolEls[1].getAttribute('data-symbol-id')).toBe('bell');
    expect(symbolEls[2].getAttribute('data-symbol-id')).toBe('seven');
  });

  it('wraps around when stopPosition exceeds symbols length', () => {
    const { container } = render(
      <Reel symbols={symbols} spinning={false} stopPosition={4} rowCount={3} />
    );
    const symbolEls = container.querySelectorAll('.reeljs-symbol');
    expect(symbolEls[0].getAttribute('data-symbol-id')).toBe('lemon');
    expect(symbolEls[1].getAttribute('data-symbol-id')).toBe('cherry');
    expect(symbolEls[2].getAttribute('data-symbol-id')).toBe('bell');
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
    const symbolEls = container.querySelectorAll('.reeljs-symbol');
    expect(symbolEls.length).toBe(0);
  });
});
