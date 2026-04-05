import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameMode } from './useGameMode';
import type { GameModeManagerConfig } from '../game/game-mode-manager';
import type { SpinResult, WinningRole } from '../types';

const defaultConfig: GameModeManagerConfig = {
  transitionConfig: {
    normalToChance: 0,
    chanceTobt: 0,
    btToSuperBigBonus: 0,
  },
  bonusConfigs: {
    SUPER_BIG_BONUS: { type: 'SUPER_BIG_BONUS', payoutMultiplier: 3, maxSpins: 30, maxPayout: 500 },
    BIG_BONUS: { type: 'BIG_BONUS', payoutMultiplier: 2, maxSpins: 20, maxPayout: 300 },
    REG_BONUS: { type: 'REG_BONUS', payoutMultiplier: 1, maxSpins: 10, maxPayout: 100 },
  },
  btConfig: { maxSpins: 50, maxPayout: 1000, winPatterns: [] },
  chanceConfig: { maxSpins: 20, maxPayout: 500, winPatterns: [] },
};

const missRole: WinningRole = {
  id: 'miss', name: 'ハズレ', type: 'MISS', payout: 0, patterns: [], priority: 0,
};

const makeSpinResult = (totalPayout = 0): SpinResult => ({
  grid: [['A', 'B', 'C']],
  stopResults: [],
  winLines: [],
  totalPayout,
  isReplay: false,
  isMiss: true,
  winningRole: missRole,
});

describe('useGameMode', () => {
  it('returns initial Normal mode', () => {
    const { result } = renderHook(() => useGameMode(defaultConfig));
    expect(result.current.currentMode).toBe('Normal');
    expect(result.current.currentBonusType).toBeNull();
    expect(result.current.remainingSpins).toBeNull();
  });

  it('transitions to Bonus on BONUS winning role', () => {
    const { result } = renderHook(() => useGameMode(defaultConfig));
    const bonusRole: WinningRole = {
      id: 'bb', name: 'BIG_BONUS', type: 'BONUS', bonusType: 'BIG_BONUS',
      payout: 0, patterns: [], priority: 1,
    };
    act(() => {
      result.current.evaluateTransition(makeSpinResult(), bonusRole);
    });
    expect(result.current.currentMode).toBe('Bonus');
    expect(result.current.currentBonusType).toBe('BIG_BONUS');
  });
});
