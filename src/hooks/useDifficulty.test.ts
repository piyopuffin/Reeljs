import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDifficulty } from './useDifficulty';
import type { DifficultyPresetConfig } from '../types';

const config: DifficultyPresetConfig = {
  levels: {
    1: { level: 1, lotteryProbabilities: { BONUS: 0.02 }, transitionProbabilities: {}, replayProbability: 0.1 },
    2: { level: 2, lotteryProbabilities: { BONUS: 0.04 }, transitionProbabilities: {}, replayProbability: 0.15 },
  },
  initialLevel: 1,
};

describe('useDifficulty', () => {
  it('returns initial level and config', () => {
    const { result } = renderHook(() => useDifficulty(config));
    expect(result.current.currentLevel).toBe(1);
    expect(result.current.currentConfig.replayProbability).toBe(0.1);
  });

  it('setDifficulty changes level and config', () => {
    const { result } = renderHook(() => useDifficulty(config));
    act(() => {
      result.current.setDifficulty(2);
    });
    expect(result.current.currentLevel).toBe(2);
    expect(result.current.currentConfig.replayProbability).toBe(0.15);
  });
});
