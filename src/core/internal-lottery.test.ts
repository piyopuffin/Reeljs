import { describe, it, expect } from 'vitest';
import { InternalLottery, DEFAULT_ROLE_DEFINITIONS } from './internal-lottery';
import type { InternalLotteryConfig } from './internal-lottery';
import type { GameMode, WinningRoleDefinition } from '../types';

/** テスト用の基本確率設定 */
function createBasicConfig(overrides?: Partial<InternalLotteryConfig>): InternalLotteryConfig {
  return {
    probabilities: {
      Normal: {
        cherry: 0.1,
        watermelon: 0.05,
        bell: 0.08,
        replay: 0.15,
        super_big_bonus: 0.005,
        big_bonus: 0.01,
        reg_bonus: 0.015,
      },
      Chance: {
        cherry: 0.12,
        replay: 0.2,
        super_big_bonus: 0.01,
      },
      Bonus: {
        cherry: 0.15,
        bell: 0.2,
        replay: 0.05,
      },
      BT: {
        cherry: 0.1,
        replay: 0.18,
        super_big_bonus: 0.02,
      },
    },
    winningRoleDefinitions: [],
    ...overrides,
  };
}

describe('InternalLottery', () => {
  describe('constructor', () => {
    it('should create an instance with valid config', () => {
      const lottery = new InternalLottery(createBasicConfig());
      expect(lottery).toBeInstanceOf(InternalLottery);
    });

    it('should use default role definitions when empty array is provided', () => {
      const lottery = new InternalLottery(createBasicConfig());
      // draw should work with default definitions
      const result = lottery.draw('Normal');
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should accept custom role definitions', () => {
      const customDefs: WinningRoleDefinition[] = [
        { id: 'star', name: 'Star', type: 'SMALL_WIN', payout: 5, patterns: [['star', 'star', 'star']], priority: 10 },
      ];
      const lottery = new InternalLottery(createBasicConfig({
        winningRoleDefinitions: customDefs,
        probabilities: { Normal: { star: 0.5 }, Chance: {}, Bonus: {}, BT: {} },
      }));
      expect(lottery).toBeInstanceOf(InternalLottery);
    });
  });

  describe('validation', () => {
    it('should throw on duplicate WinningRoleDefinition IDs', () => {
      const defs: WinningRoleDefinition[] = [
        { id: 'dup', name: 'A', type: 'SMALL_WIN', payout: 1, patterns: [['a']], priority: 1 },
        { id: 'dup', name: 'B', type: 'SMALL_WIN', payout: 2, patterns: [['b']], priority: 2 },
      ];
      expect(() => new InternalLottery(createBasicConfig({
        winningRoleDefinitions: defs,
        probabilities: { Normal: { dup: 0.1 }, Chance: {}, Bonus: {}, BT: {} },
      }))).toThrow('Duplicate WinningRoleDefinition ID: "dup"');
    });

    it('should throw on negative payout', () => {
      const defs: WinningRoleDefinition[] = [
        { id: 'bad', name: 'Bad', type: 'SMALL_WIN', payout: -5, patterns: [['x']], priority: 1 },
      ];
      expect(() => new InternalLottery(createBasicConfig({
        winningRoleDefinitions: defs,
        probabilities: { Normal: {}, Chance: {}, Bonus: {}, BT: {} },
      }))).toThrow('Negative payout');
    });

    it('should throw on empty patterns', () => {
      const defs: WinningRoleDefinition[] = [
        { id: 'empty', name: 'Empty', type: 'SMALL_WIN', payout: 1, patterns: [], priority: 1 },
      ];
      expect(() => new InternalLottery(createBasicConfig({
        winningRoleDefinitions: defs,
        probabilities: { Normal: {}, Chance: {}, Bonus: {}, BT: {} },
      }))).toThrow('Empty patterns');
    });

    it('should throw when probability sum exceeds 1', () => {
      expect(() => new InternalLottery(createBasicConfig({
        probabilities: {
          Normal: { cherry: 0.6, bell: 0.5 },
          Chance: {},
          Bonus: {},
          BT: {},
        },
      }))).toThrow('Probability sum exceeds 1');
    });

    it('should throw on negative probability', () => {
      expect(() => new InternalLottery(createBasicConfig({
        probabilities: {
          Normal: { cherry: -0.1 },
          Chance: {},
          Bonus: {},
          BT: {},
        },
      }))).toThrow('Negative probability');
    });
  });

  describe('draw', () => {
    it('should return MISS when random value exceeds all probabilities', () => {
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.999,
      }));
      const result = lottery.draw('Normal');
      expect(result.type).toBe('MISS');
    });

    it('should return the correct role based on random value', () => {
      // cherry probability is 0.1, so random < 0.1 should hit cherry
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.05,
      }));
      const result = lottery.draw('Normal');
      expect(result.id).toBe('cherry');
      expect(result.type).toBe('SMALL_WIN');
      expect(result.payout).toBe(2);
    });

    it('should return REPLAY for replay role', () => {
      // cherry=0.1, watermelon=0.05, bell=0.08 => cumulative 0.23
      // replay=0.15 => cumulative 0.38
      // random 0.25 should hit replay
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.25,
      }));
      const result = lottery.draw('Normal');
      expect(result.type).toBe('REPLAY');
    });

    it('should return BONUS with bonusType for bonus roles', () => {
      // cherry=0.1, watermelon=0.05, bell=0.08, replay=0.15 => cumulative 0.38
      // super_big_bonus=0.005 => cumulative 0.385
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.38,
      }));
      const result = lottery.draw('Normal');
      expect(result.type).toBe('BONUS');
      expect(result.bonusType).toBe('SUPER_BIG_BONUS');
    });

    it('should use different probabilities per GameMode', () => {
      // Chance mode: cherry=0.12, replay=0.2, super_big_bonus=0.01
      // random 0.15 => cumulative cherry=0.12, then replay starts at 0.12
      // 0.15 < 0.32 => replay
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.15,
      }));
      const result = lottery.draw('Chance');
      expect(result.type).toBe('REPLAY');
    });

    it('should support custom random function', () => {
      let callCount = 0;
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => {
          callCount++;
          return 0.05; // always hit cherry
        },
      }));
      lottery.draw('Normal');
      expect(callCount).toBe(1);
    });

    it('should return MISS for undefined GameMode probabilities', () => {
      const lottery = new InternalLottery({
        probabilities: { Normal: {}, Chance: {}, Bonus: {}, BT: {} },
        winningRoleDefinitions: [],
      });
      const result = lottery.draw('Normal');
      expect(result.type).toBe('MISS');
    });
  });

  describe('CarryOverFlag management', () => {
    it('should have no carry-over initially', () => {
      const lottery = new InternalLottery(createBasicConfig());
      expect(lottery.getCarryOverFlag()).toBeNull();
    });

    it('should set carry-over flag', () => {
      const lottery = new InternalLottery(createBasicConfig());
      const bonusRole = {
        id: 'super_big_bonus',
        name: 'SUPER BIG BONUS',
        type: 'BONUS' as const,
        bonusType: 'SUPER_BIG_BONUS' as const,
        payout: 0,
        patterns: [['seven', 'seven', 'seven']],
        priority: 100,
      };
      lottery.setCarryOver(bonusRole);
      const flag = lottery.getCarryOverFlag();
      expect(flag).not.toBeNull();
      expect(flag!.winningRole.id).toBe('super_big_bonus');
      expect(flag!.gameCount).toBe(0);
    });

    it('should prioritize carry-over bonus in draw', () => {
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.999, // would normally be MISS
      }));
      const bonusRole = {
        id: 'super_big_bonus',
        name: 'SUPER BIG BONUS',
        type: 'BONUS' as const,
        bonusType: 'SUPER_BIG_BONUS' as const,
        payout: 0,
        patterns: [['seven', 'seven', 'seven']],
        priority: 100,
      };
      lottery.setCarryOver(bonusRole);

      const result = lottery.draw('Normal');
      expect(result.id).toBe('super_big_bonus');
      expect(result.type).toBe('BONUS');
    });

    it('should increment gameCount on each draw during carry-over', () => {
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.999,
      }));
      const bonusRole = {
        id: 'big_bonus',
        name: 'BIG BONUS',
        type: 'BONUS' as const,
        bonusType: 'BIG_BONUS' as const,
        payout: 0,
        patterns: [['bar', 'bar', 'bar']],
        priority: 90,
      };
      lottery.setCarryOver(bonusRole);

      lottery.draw('Normal');
      expect(lottery.getCarryOverFlag()!.gameCount).toBe(1);

      lottery.draw('Normal');
      expect(lottery.getCarryOverFlag()!.gameCount).toBe(2);
    });

    it('should clear carry-over flag', () => {
      const lottery = new InternalLottery(createBasicConfig());
      const bonusRole = {
        id: 'reg_bonus',
        name: 'REG BONUS',
        type: 'BONUS' as const,
        payout: 0,
        patterns: [['seven', 'seven', 'bar']],
        priority: 80,
      };
      lottery.setCarryOver(bonusRole);
      expect(lottery.getCarryOverFlag()).not.toBeNull();

      lottery.clearCarryOver();
      expect(lottery.getCarryOverFlag()).toBeNull();
    });

    it('should resume normal lottery after carry-over is cleared', () => {
      const lottery = new InternalLottery(createBasicConfig({
        randomFn: () => 0.999,
      }));
      const bonusRole = {
        id: 'big_bonus',
        name: 'BIG BONUS',
        type: 'BONUS' as const,
        payout: 0,
        patterns: [['bar', 'bar', 'bar']],
        priority: 90,
      };
      lottery.setCarryOver(bonusRole);
      lottery.clearCarryOver();

      const result = lottery.draw('Normal');
      expect(result.type).toBe('MISS');
    });
  });

  describe('default role presets', () => {
    it('should provide default role definitions', () => {
      expect(DEFAULT_ROLE_DEFINITIONS.length).toBeGreaterThan(0);
      const ids = DEFAULT_ROLE_DEFINITIONS.map((d) => d.id);
      expect(ids).toContain('cherry');
      expect(ids).toContain('watermelon');
      expect(ids).toContain('bell');
      expect(ids).toContain('replay');
      expect(ids).toContain('super_big_bonus');
      expect(ids).toContain('big_bonus');
      expect(ids).toContain('reg_bonus');
    });
  });

  describe('replay probability per GameMode', () => {
    it('should allow different replay probabilities per mode', () => {
      const config: InternalLotteryConfig = {
        probabilities: {
          Normal: { replay: 0.9 },
          Chance: { replay: 0.1 },
          Bonus: { replay: 0.01 },
          BT: { replay: 0.5 },
        },
        winningRoleDefinitions: [],
        randomFn: () => 0.05,
      };
      const lottery = new InternalLottery(config);

      // Normal: replay=0.9, random=0.05 => replay
      expect(lottery.draw('Normal').type).toBe('REPLAY');
      // Chance: replay=0.1, random=0.05 => replay
      expect(lottery.draw('Chance').type).toBe('REPLAY');
      // Bonus: replay=0.01, random=0.05 => MISS (0.05 > 0.01)
      expect(lottery.draw('Bonus').type).toBe('MISS');
    });
  });

  describe('BONUS sub-type probabilities', () => {
    it('should correctly assign SUPER_BIG_BONUS type', () => {
      const config: InternalLotteryConfig = {
        probabilities: {
          Normal: { super_big_bonus: 1.0 },
          Chance: {},
          Bonus: {},
          BT: {},
        },
        winningRoleDefinitions: [],
        randomFn: () => 0.5,
      };
      const lottery = new InternalLottery(config);
      const result = lottery.draw('Normal');
      expect(result.type).toBe('BONUS');
      expect(result.bonusType).toBe('SUPER_BIG_BONUS');
    });

    it('should correctly assign BIG_BONUS type', () => {
      const config: InternalLotteryConfig = {
        probabilities: {
          Normal: { big_bonus: 1.0 },
          Chance: {},
          Bonus: {},
          BT: {},
        },
        winningRoleDefinitions: [],
        randomFn: () => 0.5,
      };
      const lottery = new InternalLottery(config);
      const result = lottery.draw('Normal');
      expect(result.type).toBe('BONUS');
      expect(result.bonusType).toBe('BIG_BONUS');
    });

    it('should correctly assign REG_BONUS type', () => {
      const config: InternalLotteryConfig = {
        probabilities: {
          Normal: { reg_bonus: 1.0 },
          Chance: {},
          Bonus: {},
          BT: {},
        },
        winningRoleDefinitions: [],
        randomFn: () => 0.5,
      };
      const lottery = new InternalLottery(config);
      const result = lottery.draw('Normal');
      expect(result.type).toBe('BONUS');
      expect(result.bonusType).toBe('REG_BONUS');
    });
  });
});
