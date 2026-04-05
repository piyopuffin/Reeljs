import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameCycle } from './useGameCycle';
import type { GameCycleManagerConfig } from '../game/game-cycle-manager';

const emptyConfig: GameCycleManagerConfig = {};

describe('useGameCycle', () => {
  it('returns initial WAITING phase', () => {
    const { result } = renderHook(() => useGameCycle(emptyConfig));
    expect(result.current.currentPhase).toBe('WAITING');
    expect(result.current.isReplay).toBe(false);
  });

  it('startCycle transitions to BET', () => {
    const { result } = renderHook(() => useGameCycle(emptyConfig));
    act(() => {
      result.current.startCycle();
    });
    expect(result.current.currentPhase).toBe('BET');
  });

  it('onPhase callback fires on phase transition', () => {
    const { result } = renderHook(() => useGameCycle(emptyConfig));
    const cb = vi.fn();

    act(() => {
      result.current.onPhase('BET', cb);
    });

    act(() => {
      result.current.startCycle();
    });

    expect(cb).toHaveBeenCalledTimes(1);
  });
});
