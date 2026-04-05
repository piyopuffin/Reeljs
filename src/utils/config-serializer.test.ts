import { describe, it, expect } from 'vitest';
import { ConfigSerializer } from './config-serializer';
import type { GameConfig } from '../types';

/** Minimal valid GameConfig for testing */
function createValidConfig(): GameConfig {
  return {
    reelConfigs: [
      {
        symbols: [{ id: 'cherry', name: 'Cherry', weight: 1 }],
        reelStrip: ['cherry'],
      },
    ],
    payTable: {
      entries: [
        { pattern: ['cherry', 'cherry', 'cherry'], payout: 10, roleType: 'SMALL_WIN' },
      ],
    },
    paylines: [{ index: 0, positions: [0, 0, 0] }],
    modeTransitionConfig: {
      normalToChance: 0.05,
      chanceTobt: 0.1,
      btToSuperBigBonus: 0.02,
    },
    bonusConfigs: {
      SUPER_BIG_BONUS: { type: 'SUPER_BIG_BONUS', payoutMultiplier: 3, maxSpins: 30, maxPayout: 300 },
      BIG_BONUS: { type: 'BIG_BONUS', payoutMultiplier: 2, maxSpins: 20, maxPayout: 200 },
      REG_BONUS: { type: 'REG_BONUS', payoutMultiplier: 1, maxSpins: 10, maxPayout: 100 },
    },
    btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [{ symbols: ['seven', 'seven', 'seven'] }] },
    chanceConfig: { maxSpins: 30, maxPayout: 300, winPatterns: [{ symbols: ['bar', 'bar', 'bar'] }] },
    notificationConfig: {
      enabledTypes: { PRE_SPIN: true, POST_SPIN: false },
      targetRoleTypes: ['BONUS'],
    },
    zoneConfigs: {
      normal: { name: '通常区間', maxGames: 1000, maxNetCredits: 2000, resetTargets: ['gameMode'], nextZone: 'special', isSpecial: false },
    },
    betConfig: { initialCredit: 1000, betOptions: [1, 2, 3], defaultBet: 1 },
    thresholdConfigs: [
      { counterName: 'normal', targetGameMode: 'Normal', threshold: 500, action: 'bonus', resetCondition: 'bonus' },
    ],
    difficultyConfigs: {
      1: { level: 1, lotteryProbabilities: { cherry: 0.1 }, transitionProbabilities: { normalToChance: 0.05 }, replayProbability: 0.15 },
    },
    winningRoleDefinitions: [
      { id: 'cherry', name: 'Cherry', type: 'SMALL_WIN', payout: 2, patterns: [['cherry', 'cherry', 'cherry']], priority: 10 },
    ],
  };
}

describe('ConfigSerializer', () => {
  describe('serialize', () => {
    it('should produce a valid JSON string', () => {
      const config = createValidConfig();
      const json = ConfigSerializer.serialize(config);
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('deserialize', () => {
    it('should parse a valid JSON string into GameConfig', () => {
      const config = createValidConfig();
      const json = ConfigSerializer.serialize(config);
      const result = ConfigSerializer.deserialize(json);
      expect(result).toEqual(config);
    });

    it('should throw on invalid JSON', () => {
      expect(() => ConfigSerializer.deserialize('not json')).toThrow(/Failed to parse JSON/);
    });

    it('should throw on empty string', () => {
      expect(() => ConfigSerializer.deserialize('')).toThrow(/Failed to parse JSON/);
    });

    it('should throw when required fields are missing', () => {
      const partial = { reelConfigs: [] };
      const json = JSON.stringify(partial);
      expect(() => ConfigSerializer.deserialize(json)).toThrow(/missing required fields/);
    });

    it('should include missing field names in the error', () => {
      const json = JSON.stringify({ reelConfigs: [] });
      try {
        ConfigSerializer.deserialize(json);
        expect.fail('should have thrown');
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).toContain('payTable');
        expect(msg).toContain('paylines');
      }
    });
  });

  describe('validate', () => {
    it('should return true for a valid GameConfig', () => {
      const config = createValidConfig();
      expect(ConfigSerializer.validate(config)).toBe(true);
    });

    it('should return false for null', () => {
      expect(ConfigSerializer.validate(null)).toBe(false);
    });

    it('should return false for a non-object', () => {
      expect(ConfigSerializer.validate('string')).toBe(false);
      expect(ConfigSerializer.validate(42)).toBe(false);
    });

    it('should return false when a required field is missing', () => {
      const config = createValidConfig();
      const { payTable, ...rest } = config as Record<string, unknown>;
      expect(ConfigSerializer.validate(rest)).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('should produce an equivalent object after serialize → deserialize', () => {
      const config = createValidConfig();
      const roundTripped = ConfigSerializer.deserialize(ConfigSerializer.serialize(config));
      expect(roundTripped).toEqual(config);
    });
  });
});
