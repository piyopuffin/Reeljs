import { describe, it, expect, vi } from 'vitest';
import { EventEmitter, GAME_EVENTS } from './event-emitter';

describe('EventEmitter', () => {
  it('should emit event to a registered listener with payload', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on('win', listener);

    emitter.emit('win', { amount: 100 });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ amount: 100 });
  });

  it('should support multiple listeners on the same event', () => {
    const emitter = new EventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('spinStart', listener1);
    emitter.on('spinStart', listener2);

    emitter.emit('spinStart', { reelIndex: 0 });

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it('should ignore emit for events with no listeners', () => {
    const emitter = new EventEmitter();
    // Should not throw
    expect(() => emitter.emit('nonExistent', 42)).not.toThrow();
  });

  it('should remove listener via off', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on('reelStop', listener);

    emitter.off('reelStop', listener);
    emitter.emit('reelStop');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should return an unsubscribe function from on()', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    const unsub = emitter.on('modeChange', listener);

    unsub();
    emitter.emit('modeChange', 'Bonus');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should emit without payload (undefined)', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on('spinStart', listener);

    emitter.emit('spinStart');

    expect(listener).toHaveBeenCalledWith(undefined);
  });

  it('should not affect other listeners when one is removed', () => {
    const emitter = new EventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('win', listener1);
    emitter.on('win', listener2);

    emitter.off('win', listener1);
    emitter.emit('win', { amount: 50 });

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it('should handle off for non-existent event gracefully', () => {
    const emitter = new EventEmitter();
    expect(() => emitter.off('noEvent', () => {})).not.toThrow();
  });

  it('should handle off for non-registered listener gracefully', () => {
    const emitter = new EventEmitter();
    emitter.on('win', () => {});
    expect(() => emitter.off('win', () => {})).not.toThrow();
  });

  it('should define all standard game events', () => {
    const expected = [
      'spinStart',
      'reelStop',
      'win',
      'bonusStart',
      'modeChange',
      'zoneChange',
      'phaseChange',
      'creditChange',
      'notification',
    ];
    expect(GAME_EVENTS).toEqual(expected);
  });

  it('should support typed payloads via generics', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn<[{ mode: string }], void>();
    emitter.on<{ mode: string }>('modeChange', listener);

    emitter.emit<{ mode: string }>('modeChange', { mode: 'Bonus' });

    expect(listener).toHaveBeenCalledWith({ mode: 'Bonus' });
  });
});
