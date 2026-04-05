import { describe, it, expect } from 'vitest';
import { DifficultyPreset } from './difficulty-preset';
import type { DifficultyPresetConfig } from '../types/difficulty';

const makeConfig = (overrides?: Partial<DifficultyPresetConfig>): DifficultyPresetConfig => ({
  initialLevel: 1,
  levels: {
    1: {
      level: 1,
      lotteryProbabilities: { BONUS: 0.02, SMALL_WIN: 0.3, REPLAY: 0.15 },
      transitionProbabilities: { normalToChance: 0.05 },
      replayProbability: 0.15,
    },
    2: {
      level: 2,
      lotteryProbabilities: { BONUS: 0.03, SMALL_WIN: 0.28, REPLAY: 0.16 },
      transitionProbabilities: { normalToChance: 0.08 },
      replayProbability: 0.16,
    },
    3: {
      level: 3,
      lotteryProbabilities: { BONUS: 0.05, SMALL_WIN: 0.25, REPLAY: 0.18 },
      transitionProbabilities: { normalToChance: 0.12 },
      replayProbability: 0.18,
    },
  },
  ...overrides,
});

describe('DifficultyPreset', () => {
  describe('initialization', () => {
    it('should initialize with the specified initial level', () => {
      const dp = new DifficultyPreset(makeConfig());
      expect(dp.currentLevel).toBe(1);
    });

    it('should return the correct config for the initial level', () => {
      const dp = new DifficultyPreset(makeConfig());
      expect(dp.currentConfig.level).toBe(1);
      expect(dp.currentConfig.lotteryProbabilities.BONUS).toBe(0.02);
    });

    it('should support any number of levels (not limited to 6)', () => {
      const levels: Record<number, any> = {};
      for (let i = 1; i <= 10; i++) {
        levels[i] = {
          level: i,
          lotteryProbabilities: { BONUS: 0.01 * i },
          transitionProbabilities: {},
          replayProbability: 0.1 + 0.01 * i,
        };
      }
      const dp = new DifficultyPreset({ levels, initialLevel: 5 });
      expect(dp.currentLevel).toBe(5);
      expect(dp.getAvailableLevels()).toHaveLength(10);
    });
  });

  describe('setDifficulty', () => {
    it('should switch to a valid level', () => {
      const dp = new DifficultyPreset(makeConfig());
      dp.setDifficulty(3);
      expect(dp.currentLevel).toBe(3);
      expect(dp.currentConfig.lotteryProbabilities.BONUS).toBe(0.05);
    });

    it('should update currentConfig reactively after switching', () => {
      const dp = new DifficultyPreset(makeConfig());
      expect(dp.currentConfig.replayProbability).toBe(0.15);
      dp.setDifficulty(2);
      expect(dp.currentConfig.replayProbability).toBe(0.16);
      dp.setDifficulty(3);
      expect(dp.currentConfig.replayProbability).toBe(0.18);
    });

    it('should update all parameters in bulk when switching', () => {
      const dp = new DifficultyPreset(makeConfig());
      dp.setDifficulty(3);
      const config = dp.currentConfig;
      expect(config.lotteryProbabilities.BONUS).toBe(0.05);
      expect(config.transitionProbabilities.normalToChance).toBe(0.12);
      expect(config.replayProbability).toBe(0.18);
    });

    it('should throw for undefined level', () => {
      const dp = new DifficultyPreset(makeConfig());
      expect(() => dp.setDifficulty(99)).toThrow('Invalid difficulty level: 99');
    });
  });

  describe('validation', () => {
    it('should throw if levels is empty', () => {
      expect(() => new DifficultyPreset({ levels: {}, initialLevel: 1 })).toThrow(
        'must have at least one level'
      );
    });

    it('should throw if initialLevel is not defined in levels', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: { level: 1, lotteryProbabilities: {}, transitionProbabilities: {}, replayProbability: 0.1 },
            },
            initialLevel: 5,
          })
      ).toThrow('Initial level 5 is not defined');
    });

    it('should throw for lottery probability < 0', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: { level: 1, lotteryProbabilities: { BONUS: -0.1 }, transitionProbabilities: {}, replayProbability: 0.1 },
            },
            initialLevel: 1,
          })
      ).toThrow('Invalid lottery probability');
    });

    it('should throw for lottery probability > 1', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: { level: 1, lotteryProbabilities: { BONUS: 1.5 }, transitionProbabilities: {}, replayProbability: 0.1 },
            },
            initialLevel: 1,
          })
      ).toThrow('Invalid lottery probability');
    });

    it('should throw for transition probability < 0', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: {
                level: 1,
                lotteryProbabilities: {},
                transitionProbabilities: { normalToChance: -0.5 },
                replayProbability: 0.1,
              },
            },
            initialLevel: 1,
          })
      ).toThrow('Invalid transition probability');
    });

    it('should throw for transition probability > 1', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: {
                level: 1,
                lotteryProbabilities: {},
                transitionProbabilities: { chanceTobt: 2.0 },
                replayProbability: 0.1,
              },
            },
            initialLevel: 1,
          })
      ).toThrow('Invalid transition probability');
    });

    it('should throw for replay probability < 0', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: { level: 1, lotteryProbabilities: {}, transitionProbabilities: {}, replayProbability: -0.1 },
            },
            initialLevel: 1,
          })
      ).toThrow('Invalid replay probability');
    });

    it('should throw for replay probability > 1', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: { level: 1, lotteryProbabilities: {}, transitionProbabilities: {}, replayProbability: 1.5 },
            },
            initialLevel: 1,
          })
      ).toThrow('Invalid replay probability');
    });

    it('should accept boundary values 0 and 1', () => {
      expect(
        () =>
          new DifficultyPreset({
            levels: {
              1: {
                level: 1,
                lotteryProbabilities: { BONUS: 0, MISS: 1 },
                transitionProbabilities: { normalToChance: 0 },
                replayProbability: 0,
              },
            },
            initialLevel: 1,
          })
      ).not.toThrow();
    });
  });

  describe('getAvailableLevels', () => {
    it('should return all defined levels', () => {
      const dp = new DifficultyPreset(makeConfig());
      expect(dp.getAvailableLevels().sort()).toEqual([1, 2, 3]);
    });
  });
});
