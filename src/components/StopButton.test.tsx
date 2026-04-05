import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StopButton } from './StopButton';

describe('StopButton', () => {
  it('renders a button with default aria-label', () => {
    const onStop = vi.fn();
    render(<StopButton reelIndex={0} onStop={onStop} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBe('Stop reel 1');
  });

  it('uses custom aria-label when provided', () => {
    const onStop = vi.fn();
    render(<StopButton reelIndex={1} onStop={onStop} aria-label="カスタムラベル" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBe('カスタムラベル');
  });

  it('calls onStop with reelIndex when clicked and not disabled', () => {
    const onStop = vi.fn();
    render(<StopButton reelIndex={2} onStop={onStop} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop.mock.calls[0][0]).toBe(2);
    expect(typeof onStop.mock.calls[0][1]).toBe('number');
  });

  it('does not call onStop when disabled', () => {
    const onStop = vi.fn();
    render(<StopButton reelIndex={0} onStop={onStop} disabled={true} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onStop).not.toHaveBeenCalled();
  });

  it('renders as disabled when disabled prop is true', () => {
    const onStop = vi.fn();
    render(<StopButton reelIndex={0} onStop={onStop} disabled={true} />);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('applies disabled CSS class when disabled', () => {
    const onStop = vi.fn();
    const { container } = render(
      <StopButton reelIndex={0} onStop={onStop} disabled={true} />
    );
    const btn = container.firstElementChild!;
    expect(btn.className).toContain('reeljs-stop-button--disabled');
  });

  it('applies custom className and style', () => {
    const onStop = vi.fn();
    const { container } = render(
      <StopButton
        reelIndex={0}
        onStop={onStop}
        className="my-btn"
        style={{ color: 'red' }}
      />
    );
    const btn = container.firstElementChild! as HTMLElement;
    expect(btn.className).toContain('my-btn');
    expect(btn.style.color).toBe('red');
  });
});
