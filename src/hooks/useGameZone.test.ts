import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameZone } from './useGameZone';
import type { ZoneManagerConfig } from '../game/zone-manager';
import type { SpinResult, WinningRole } from '../types';

const missRole: WinningRole = {
  id: 'miss', name: 'ハズレ', type: 'MISS', payout: 0, patterns: [], priority: 0,
};

const zoneConfig: ZoneManagerConfig = {
  zones: {
    normal: { name: '通常区間', maxGames: 100, maxNetCredits: 500, resetTargets: [], nextZone: 'special', isSpecial: false },
    special: { name: '特別区間', maxGames: 50, maxNetCredits: 300, resetTargets: [], nextZone: 'normal', isSpecial: true },
  },
  initialZone: 'normal',
};

const makeSpinResult = (totalPayout = 10): SpinResult => ({
  grid: [['A', 'B', 'C']],
  stopResults: [],
  winLines: [],
  totalPayout,
  isReplay: false,
  isMiss: false,
  winningRole: missRole,
});

describe('useGameZone', () => {
  it('returns initial zone state', () => {
    const { result } = renderHook(() => useGameZone(zoneConfig));
    expect(result.current.currentZone).toBe('normal');
    expect(result.current.gamesPlayed).toBe(0);
    expect(result.current.netCredits).toBe(0);
    expect(result.current.indicator.isSpecialZone).toBe(false);
    expect(result.current.remainingGames).toBe(100);
    expect(result.current.remainingCredits).toBe(500);
  });

  it('updates state after spin result', () => {
    const { result } = renderHook(() => useGameZone(zoneConfig));
    act(() => {
      result.current.update(makeSpinResult(10));
    });
    expect(result.current.gamesPlayed).toBe(1);
    expect(result.current.netCredits).toBe(10);
    expect(result.current.remainingGames).toBe(99);
  });
});
