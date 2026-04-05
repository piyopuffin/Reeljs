import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThresholdTrigger } from './useThresholdTrigger';
import type { ThresholdConfig } from '../types';

const configs: ThresholdConfig[] = [
  {
    counterName: 'normalSpins',
    targetGameMode: 'Normal',
    threshold: 100,
    action: 'forceBonus',
    resetCondition: 'BonusMode',
  },
];

describe('useThresholdTrigger', () => {
  it('returns initial counters and thresholds', () => {
    const { result } = renderHook(() => useThresholdTrigger(configs));
    expect(result.current.counters).toEqual({ normalSpins: 0 });
    expect(result.current.thresholds).toEqual({ normalSpins: 100 });
  });

  it('resetCounter resets counter to 0', () => {
    const { result } = renderHook(() => useThresholdTrigger(configs));

    // Manually increment via internal counter
    act(() => {
      result.current._counter.increment('normalSpins');
      result.current._sync();
    });
    expect(result.current.counters.normalSpins).toBe(1);

    act(() => {
      result.current.resetCounter('normalSpins');
    });
    expect(result.current.counters.normalSpins).toBe(0);
  });
});
