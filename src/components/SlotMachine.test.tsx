import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SlotMachine } from './SlotMachine';
import type { SymbolDefinition } from '../types';

const testSymbols: SymbolDefinition[] = [
  { id: 'cherry', name: 'Cherry', weight: 1 },
  { id: 'bell', name: 'Bell', weight: 1 },
  { id: 'seven', name: 'Seven', weight: 1 },
];

describe('SlotMachine', () => {
  it('renders default 3 reels', () => {
    const { container } = render(<SlotMachine symbols={testSymbols} />);
    const reels = container.querySelectorAll('.reeljs-reel');
    expect(reels.length).toBe(3);
  });

  it('renders custom reelCount', () => {
    const { container } = render(
      <SlotMachine symbols={testSymbols} reelCount={5} />
    );
    const reels = container.querySelectorAll('.reeljs-reel');
    expect(reels.length).toBe(5);
  });

  it('renders stop buttons by default', () => {
    render(<SlotMachine symbols={testSymbols} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('hides stop buttons when showStopButtons is false', () => {
    render(<SlotMachine symbols={testSymbols} showStopButtons={false} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('renders children instead of default layout', () => {
    render(
      <SlotMachine symbols={testSymbols}>
        <div data-testid="custom-layout">Custom</div>
      </SlotMachine>
    );
    expect(screen.getByTestId('custom-layout')).toBeDefined();
    // No default reels rendered
    const { container } = render(
      <SlotMachine symbols={testSymbols}>
        <div>Custom</div>
      </SlotMachine>
    );
    const reels = container.querySelectorAll('.reeljs-reel');
    expect(reels.length).toBe(0);
  });

  it('applies custom className and style', () => {
    const { container } = render(
      <SlotMachine
        symbols={testSymbols}
        className="my-slot"
        style={{ border: '1px solid red' }}
      />
    );
    const el = container.firstElementChild! as HTMLElement;
    expect(el.className).toContain('my-slot');
    expect(el.style.border).toBe('1px solid red');
  });

  it('propagates renderSymbol to reels', () => {
    const renderSymbol = (id: string) => <span data-testid={`custom-${id}`}>{id}</span>;
    const { container } = render(
      <SlotMachine symbols={testSymbols} renderSymbol={renderSymbol} reelCount={1} rowCount={3} />
    );
    // Should find custom rendered symbols
    const customEls = container.querySelectorAll('[data-testid^="custom-"]');
    expect(customEls.length).toBe(3);
  });
});
