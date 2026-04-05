import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThresholdTrigger } from './threshold-trigger';
import type { ThresholdConfig } from '../types/threshold';

const fixedConfig: ThresholdConfig = {
  counterName: 'normalCounter',
  targetGameMode: 'Normal',
  threshold: 100,
  action: 'forceBonus',
  resetCondition: 'BonusMode',
};

const rangeConfig: ThresholdConfig = {
  counterName: 'chanceCounter',
  targetGameMode: 'Chance',
  threshold: { min: 50, max: 150 },
  action: 'forceBT',
  resetCondition: 'BonusMode',
};

describe('ThresholdTrigger', () => {
  describe('constructor validation', () => {
    it('should throw on threshold <= 0 (fixed)', () => {
      expect(() => new ThresholdTrigger([{ ...fixedConfig, threshold: 0 }]))
        .toThrow('threshold must be greater than 0');
    });

    it('should throw on negative threshold (fixed)', () => {
      expect(() => new ThresholdTrigger([{ ...fixedConfig, threshold: -5 }]))
        .toThrow('threshold must be greater than 0');
    });

    it('should throw on ThresholdRange min > max', () => {
      expect(() => new ThresholdTrigger([{
        ...rangeConfig,
        threshold: { min: 200, max: 100 },
      }])).toThrow('min (200) must not exceed max (100)');
    });

    it('should throw on ThresholdRange with min <= 0', () => {
      expect(() => new ThresholdTrigger([{
        ...rangeConfig,
        threshold: { min: 0, max: 100 },
      }])).toThrow('min and max must be greater than 0');
    });

    it('should throw on ThresholdRange with max <= 0', () => {
      expect(() => new ThresholdTrigger([{
        ...rangeConfig,
        threshold: { min: -1, max: 0 },
      }])).toThrow('min and max must be greater than 0');
    });

    it('should accept valid configs without error', () => {
      expect(() => new ThresholdTrigger([fixedConfig, rangeConfig])).not.toThrow();
    });

    it('should work with empty config', () => {
      const tt = new ThresholdTrigger();
      expect(tt.getAllThresholds()).toEqual({});
    });
  });

  describe('check (fixed threshold)', () => {
    let tt: ThresholdTrigger;

    beforeEach(() => {
      tt = new ThresholdTrigger([fixedConfig]);
    });

    it('should return false when value is below threshold', () => {
      expect(tt.check('normalCounter', 50)).toBe(false);
    });

    it('should return true when value equals threshold', () => {
      expect(tt.check('normalCounter', 100)).toBe(true);
    });

    it('should return true when value exceeds threshold', () => {
      expect(tt.check('normalCounter', 150)).toBe(true);
    });

    it('should return false for unknown counter', () => {
      expect(tt.check('unknown', 999)).toBe(false);
    });
  });

  describe('check (ThresholdRange)', () => {
    it('should resolve threshold within range', () => {
      // Use a deterministic random that always returns 0.5
      // For range [50, 150]: floor(0.5 * 101) + 50 = 50 + 50 = 100
      const tt = new ThresholdTrigger([rangeConfig], () => 0.5);
      expect(tt.getThreshold('chanceCounter')).toBe(100);
    });

    it('should resolve to min when random returns 0', () => {
      const tt = new ThresholdTrigger([rangeConfig], () => 0);
      expect(tt.getThreshold('chanceCounter')).toBe(50);
    });

    it('should resolve to max when random returns ~1', () => {
      // floor(0.999 * 101) + 50 = floor(100.899) + 50 = 100 + 50 = 150
      const tt = new ThresholdTrigger([rangeConfig], () => 0.999);
      expect(tt.getThreshold('chanceCounter')).toBe(150);
    });
  });

  describe('onThresholdReached callback', () => {
    it('should invoke callback when threshold is reached', () => {
      const tt = new ThresholdTrigger([fixedConfig]);
      const cb = vi.fn();
      tt.onThresholdReached(cb);

      tt.check('normalCounter', 100);
      expect(cb).toHaveBeenCalledWith('normalCounter', 100, 'forceBonus');
    });

    it('should not invoke callback when below threshold', () => {
      const tt = new ThresholdTrigger([fixedConfig]);
      const cb = vi.fn();
      tt.onThresholdReached(cb);

      tt.check('normalCounter', 50);
      expect(cb).not.toHaveBeenCalled();
    });

    it('should invoke multiple callbacks', () => {
      const tt = new ThresholdTrigger([fixedConfig]);
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      tt.onThresholdReached(cb1);
      tt.onThresholdReached(cb2);

      tt.check('normalCounter', 100);
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
    });
  });

  describe('reroll', () => {
    it('should re-roll threshold for ThresholdRange configs', () => {
      let callCount = 0;
      const randomFn = () => {
        callCount++;
        return callCount === 1 ? 0.0 : 0.999;
      };
      const tt = new ThresholdTrigger([rangeConfig], randomFn);

      // First resolve: 0.0 → min = 50
      expect(tt.getThreshold('chanceCounter')).toBe(50);

      // Reroll: 0.999 → max = 150
      tt.reroll('chanceCounter');
      expect(tt.getThreshold('chanceCounter')).toBe(150);
    });

    it('should keep same value for fixed threshold on reroll', () => {
      const tt = new ThresholdTrigger([fixedConfig]);
      expect(tt.getThreshold('normalCounter')).toBe(100);
      tt.reroll('normalCounter');
      expect(tt.getThreshold('normalCounter')).toBe(100);
    });

    it('should be a no-op for unknown counter', () => {
      const tt = new ThresholdTrigger([fixedConfig]);
      tt.reroll('unknown'); // should not throw
      expect(tt.getThreshold('unknown')).toBeUndefined();
    });
  });

  describe('multiple triggers', () => {
    it('should manage multiple triggers simultaneously', () => {
      const tt = new ThresholdTrigger([fixedConfig, rangeConfig], () => 0.5);
      const cb = vi.fn();
      tt.onThresholdReached(cb);

      // normalCounter threshold = 100 (fixed)
      tt.check('normalCounter', 100);
      expect(cb).toHaveBeenCalledWith('normalCounter', 100, 'forceBonus');

      // chanceCounter threshold = 100 (range resolved with 0.5)
      tt.check('chanceCounter', 100);
      expect(cb).toHaveBeenCalledWith('chanceCounter', 100, 'forceBT');

      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAllThresholds', () => {
    it('should return all resolved thresholds', () => {
      const tt = new ThresholdTrigger([fixedConfig, rangeConfig], () => 0.5);
      const all = tt.getAllThresholds();
      expect(all).toEqual({
        normalCounter: 100,
        chanceCounter: 100,
      });
    });
  });
});
