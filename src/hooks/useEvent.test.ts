import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EventEmitter } from '../infrastructure/event-emitter';
import { useEvent } from './useEvent';

describe('useEvent', () => {
  it('emits events through the emitter', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on('test', listener);

    const { result } = renderHook(() => useEvent(emitter));

    act(() => {
      result.current.emit('test', { data: 42 });
    });

    expect(listener).toHaveBeenCalledWith({ data: 42 });
  });

  it('subscribes to events via on()', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();

    const { result } = renderHook(() => useEvent(emitter));

    act(() => {
      result.current.on('myEvent', listener);
    });

    emitter.emit('myEvent', 'hello');
    expect(listener).toHaveBeenCalledWith('hello');
  });

  it('auto-unsubscribes on unmount', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();

    const { result, unmount } = renderHook(() => useEvent(emitter));

    act(() => {
      result.current.on('myEvent', listener);
    });

    emitter.emit('myEvent', 'before');
    expect(listener).toHaveBeenCalledTimes(1);

    unmount();

    emitter.emit('myEvent', 'after');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
