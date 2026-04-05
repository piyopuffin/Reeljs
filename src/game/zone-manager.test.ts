import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZoneManager } from './zone-manager';
import type { ZoneManagerConfig } from './zone-manager';
import type { SpinResult, ZoneConfig } from '../types';

/** テスト用のゾーン設定 */
const normalZone: ZoneConfig = {
  name: '通常区間',
  maxGames: 100,
  maxNetCredits: 500,
  resetTargets: ['gameMode', 'spinCounter'],
  nextZone: 'special',
  isSpecial: false,
};

const specialZone: ZoneConfig = {
  name: '特別区間',
  maxGames: 50,
  maxNetCredits: 300,
  resetTargets: ['spinCounter'],
  nextZone: 'normal',
  isSpecial: true,
};

const defaultConfig: ZoneManagerConfig = {
  zones: { normal: normalZone, special: specialZone },
  initialZone: 'normal',
};

/** テスト用の最小 SpinResult を生成 */
function makeSpinResult(totalPayout: number): SpinResult {
  return {
    grid: [],
    stopResults: [],
    winLines: [],
    totalPayout,
    isReplay: false,
    isMiss: false,
    winningRole: { id: 'miss', name: 'Miss', type: 'MISS', payout: 0, patterns: [], priority: 0 },
  };
}

describe('ZoneManager', () => {
  let zm: ZoneManager;

  beforeEach(() => {
    zm = new ZoneManager(defaultConfig);
  });

  // --- Construction & Validation ---

  describe('constructor validation', () => {
    it('should initialize with correct state', () => {
      expect(zm.currentState).toEqual({
        currentZone: 'normal',
        gamesPlayed: 0,
        netCredits: 0,
      });
    });

    it('should throw on empty zones', () => {
      expect(() => new ZoneManager({ zones: {}, initialZone: 'x' }))
        .toThrow('zones must not be empty');
    });

    it('should throw when initialZone is not in zones', () => {
      expect(() => new ZoneManager({ zones: { normal: normalZone, special: specialZone }, initialZone: 'unknown' }))
        .toThrow('initialZone "unknown" is not defined in zones');
    });

    it('should throw when maxGames <= 0', () => {
      expect(() => new ZoneManager({
        zones: {
          a: { ...normalZone, maxGames: 0, nextZone: 'a' },
        },
        initialZone: 'a',
      })).toThrow('maxGames must be greater than 0');
    });

    it('should throw when maxGames is negative', () => {
      expect(() => new ZoneManager({
        zones: {
          a: { ...normalZone, maxGames: -5, nextZone: 'a' },
        },
        initialZone: 'a',
      })).toThrow('maxGames must be greater than 0');
    });

    it('should throw when maxNetCredits <= 0', () => {
      expect(() => new ZoneManager({
        zones: {
          a: { ...normalZone, maxNetCredits: 0, nextZone: 'a' },
        },
        initialZone: 'a',
      })).toThrow('maxNetCredits must be greater than 0');
    });

    it('should throw when maxNetCredits is negative', () => {
      expect(() => new ZoneManager({
        zones: {
          a: { ...normalZone, maxNetCredits: -10, nextZone: 'a' },
        },
        initialZone: 'a',
      })).toThrow('maxNetCredits must be greater than 0');
    });

    it('should throw when nextZone references undefined zone', () => {
      expect(() => new ZoneManager({
        zones: {
          a: { ...normalZone, nextZone: 'nonexistent' },
        },
        initialZone: 'a',
      })).toThrow('nextZone "nonexistent" is not defined in zones');
    });
  });

  // --- indicator ---

  describe('indicator', () => {
    it('should return correct indicator for normal zone', () => {
      expect(zm.indicator).toEqual({
        isSpecialZone: false,
        zoneName: '通常区間',
      });
    });

    it('should return correct indicator for special zone', () => {
      const zm2 = new ZoneManager({ ...defaultConfig, initialZone: 'special' });
      expect(zm2.indicator).toEqual({
        isSpecialZone: true,
        zoneName: '特別区間',
      });
    });
  });

  // --- update() ---

  describe('update()', () => {
    it('should increment gamesPlayed on each update', () => {
      zm.update(makeSpinResult(0));
      expect(zm.currentState.gamesPlayed).toBe(1);
      zm.update(makeSpinResult(0));
      expect(zm.currentState.gamesPlayed).toBe(2);
    });

    it('should accumulate netCredits from totalPayout', () => {
      zm.update(makeSpinResult(10));
      expect(zm.currentState.netCredits).toBe(10);
      zm.update(makeSpinResult(20));
      expect(zm.currentState.netCredits).toBe(30);
    });

    it('should not transition when limits are not reached', () => {
      zm.update(makeSpinResult(5));
      expect(zm.currentState.currentZone).toBe('normal');
    });
  });

  // --- Zone termination on maxGames ---

  describe('zone termination on maxGames', () => {
    it('should transition when gamesPlayed reaches maxGames', () => {
      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(0));
      }
      expect(zm.currentState.currentZone).toBe('special');
      expect(zm.currentState.gamesPlayed).toBe(0);
      expect(zm.currentState.netCredits).toBe(0);
    });
  });

  // --- Zone termination on maxNetCredits ---

  describe('zone termination on maxNetCredits', () => {
    it('should transition when netCredits reaches maxNetCredits', () => {
      zm.update(makeSpinResult(500));
      expect(zm.currentState.currentZone).toBe('special');
      expect(zm.currentState.gamesPlayed).toBe(0);
      expect(zm.currentState.netCredits).toBe(0);
    });

    it('should transition when netCredits exceeds maxNetCredits', () => {
      zm.update(makeSpinResult(600));
      expect(zm.currentState.currentZone).toBe('special');
    });
  });

  // --- Counter reset on zone start ---

  describe('counter reset on zone start', () => {
    it('should reset gamesPlayed and netCredits on zone transition', () => {
      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(1));
      }
      // Transitioned to special zone
      expect(zm.currentState.gamesPlayed).toBe(0);
      expect(zm.currentState.netCredits).toBe(0);
    });
  });

  // --- Force reset on zone end ---

  describe('force reset on zone end', () => {
    it('should call onReset callbacks with resetTargets on zone transition', () => {
      const resetCb = vi.fn();
      zm.onReset(resetCb);

      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(0));
      }

      expect(resetCb).toHaveBeenCalledWith(['gameMode', 'spinCounter']);
    });

    it('should pass correct resetTargets for special zone', () => {
      // Transition to special zone first
      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(0));
      }
      expect(zm.currentState.currentZone).toBe('special');

      const resetCb = vi.fn();
      zm.onReset(resetCb);

      // Now transition out of special zone
      for (let i = 0; i < 50; i++) {
        zm.update(makeSpinResult(0));
      }

      expect(resetCb).toHaveBeenCalledWith(['spinCounter']);
    });
  });

  // --- onZoneChange callback ---

  describe('onZoneChange()', () => {
    it('should fire callback with from and to zone on transition', () => {
      const cb = vi.fn();
      zm.onZoneChange(cb);

      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(0));
      }

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith('normal', 'special');
    });

    it('should fire callback on netCredits-triggered transition', () => {
      const cb = vi.fn();
      zm.onZoneChange(cb);

      zm.update(makeSpinResult(500));

      expect(cb).toHaveBeenCalledWith('normal', 'special');
    });

    it('should support multiple callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      zm.onZoneChange(cb1);
      zm.onZoneChange(cb2);

      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(0));
      }

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('should not fire callback when no transition occurs', () => {
      const cb = vi.fn();
      zm.onZoneChange(cb);

      zm.update(makeSpinResult(0));

      expect(cb).not.toHaveBeenCalled();
    });
  });

  // --- Zone cycling ---

  describe('zone cycling', () => {
    it('should cycle between zones correctly', () => {
      const cb = vi.fn();
      zm.onZoneChange(cb);

      // normal → special (100 games)
      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(0));
      }
      expect(zm.currentState.currentZone).toBe('special');

      // special → normal (50 games)
      for (let i = 0; i < 50; i++) {
        zm.update(makeSpinResult(0));
      }
      expect(zm.currentState.currentZone).toBe('normal');

      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenNthCalledWith(1, 'normal', 'special');
      expect(cb).toHaveBeenNthCalledWith(2, 'special', 'normal');
    });
  });

  // --- Indicator updates after transition ---

  describe('indicator after transition', () => {
    it('should update indicator after zone transition', () => {
      expect(zm.indicator.isSpecialZone).toBe(false);

      for (let i = 0; i < 100; i++) {
        zm.update(makeSpinResult(0));
      }

      expect(zm.indicator.isSpecialZone).toBe(true);
      expect(zm.indicator.zoneName).toBe('特別区間');
    });
  });

  // --- currentState returns a copy ---

  describe('currentState immutability', () => {
    it('should return a copy of state, not a reference', () => {
      const state = zm.currentState;
      state.gamesPlayed = 999;
      expect(zm.currentState.gamesPlayed).toBe(0);
    });
  });

  // --- Self-referencing zone ---

  describe('self-referencing zone', () => {
    it('should allow a zone to transition to itself', () => {
      const selfConfig: ZoneManagerConfig = {
        zones: {
          loop: {
            name: 'ループ区間',
            maxGames: 3,
            maxNetCredits: 1000,
            resetTargets: [],
            nextZone: 'loop',
            isSpecial: false,
          },
        },
        initialZone: 'loop',
      };
      const zm2 = new ZoneManager(selfConfig);
      const cb = vi.fn();
      zm2.onZoneChange(cb);

      for (let i = 0; i < 3; i++) {
        zm2.update(makeSpinResult(0));
      }

      expect(zm2.currentState.currentZone).toBe('loop');
      expect(zm2.currentState.gamesPlayed).toBe(0);
      expect(cb).toHaveBeenCalledWith('loop', 'loop');
    });
  });
});
