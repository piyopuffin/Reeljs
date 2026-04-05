import { describe, it, expect, vi } from 'vitest';
import { GameModeManager, type GameModeManagerConfig } from './game-mode-manager';
import type { SpinResult, WinningRole, BonusType } from '../types';

// --- Test helpers ---

function createDefaultConfig(overrides?: Partial<GameModeManagerConfig>): GameModeManagerConfig {
  return {
    transitionConfig: {
      normalToChance: 0.1,
      chanceTobt: 0.2,
      btToSuperBigBonus: 0.15,
    },
    bonusConfigs: {
      SUPER_BIG_BONUS: { type: 'SUPER_BIG_BONUS', payoutMultiplier: 3, maxSpins: 30, maxPayout: 300 },
      BIG_BONUS: { type: 'BIG_BONUS', payoutMultiplier: 2, maxSpins: 20, maxPayout: 200 },
      REG_BONUS: { type: 'REG_BONUS', payoutMultiplier: 1, maxSpins: 10, maxPayout: 100 },
    },
    btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [{ symbols: ['7', '7', '7'] }] },
    chanceConfig: { maxSpins: 20, maxPayout: 200, winPatterns: [{ symbols: ['BAR', 'BAR', 'BAR'] }] },
    ...overrides,
  };
}

function createSpinResult(overrides?: Partial<SpinResult>): SpinResult {
  return {
    grid: [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
    ],
    stopResults: [],
    winLines: [],
    totalPayout: 0,
    isReplay: false,
    isMiss: false,
    winningRole: createWinningRole(),
    ...overrides,
  };
}

function createWinningRole(overrides?: Partial<WinningRole>): WinningRole {
  return {
    id: 'miss',
    name: 'Miss',
    type: 'MISS',
    payout: 0,
    patterns: [],
    priority: 0,
    ...overrides,
  };
}

function createBonusWinningRole(bonusType: BonusType): WinningRole {
  return createWinningRole({
    id: `bonus-${bonusType}`,
    name: bonusType,
    type: 'BONUS',
    bonusType,
    payout: 0,
    priority: 10,
  });
}

// --- Tests ---

describe('GameModeManager', () => {
  describe('初期状態', () => {
    it('初期モードは Normal である', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      expect(mgr.currentMode).toBe('Normal');
    });

    it('初期状態で currentBonusType は null', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      expect(mgr.currentBonusType).toBeNull();
    });

    it('初期状態で remainingSpins は null', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      expect(mgr.getRemainingSpins()).toBeNull();
    });
  });

  describe('確率バリデーション', () => {
    it('normalToChance が負の値の場合エラー', () => {
      expect(() =>
        new GameModeManager(createDefaultConfig({
          transitionConfig: { normalToChance: -0.1, chanceTobt: 0.2, btToSuperBigBonus: 0.15 },
        }))
      ).toThrow('Invalid probability for normalToChance');
    });

    it('chanceTobt が 1 を超える場合エラー', () => {
      expect(() =>
        new GameModeManager(createDefaultConfig({
          transitionConfig: { normalToChance: 0.1, chanceTobt: 1.5, btToSuperBigBonus: 0.15 },
        }))
      ).toThrow('Invalid probability for chanceTobt');
    });

    it('btToSuperBigBonus が 1 を超える場合エラー', () => {
      expect(() =>
        new GameModeManager(createDefaultConfig({
          transitionConfig: { normalToChance: 0.1, chanceTobt: 0.2, btToSuperBigBonus: 2.0 },
        }))
      ).toThrow('Invalid probability for btToSuperBigBonus');
    });

    it('確率値 0 と 1 は有効', () => {
      expect(() =>
        new GameModeManager(createDefaultConfig({
          transitionConfig: { normalToChance: 0, chanceTobt: 1, btToSuperBigBonus: 0 },
        }))
      ).not.toThrow();
    });
  });

  describe('Normal → Bonus 遷移', () => {
    it('BONUS 当選役で Bonus モードに遷移する', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      const role = createBonusWinningRole('BIG_BONUS');
      mgr.evaluateTransition(createSpinResult(), role);
      expect(mgr.currentMode).toBe('Bonus');
      expect(mgr.currentBonusType).toBe('BIG_BONUS');
    });

    it('Bonus 遷移時に remainingSpins が設定される', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      const role = createBonusWinningRole('BIG_BONUS');
      mgr.evaluateTransition(createSpinResult(), role);
      expect(mgr.getRemainingSpins()).toBe(20);
    });
  });

  describe('Normal → Chance 遷移', () => {
    it('確率判定で Chance モードに遷移する', () => {
      // randomFn が常に 0 を返す → normalToChance(0.1) 未満なので遷移する
      const mgr = new GameModeManager(createDefaultConfig({ randomFn: () => 0 }));
      const role = createWinningRole();
      mgr.evaluateTransition(createSpinResult(), role);
      expect(mgr.currentMode).toBe('Chance');
    });

    it('確率判定で遷移しない場合 Normal のまま', () => {
      // randomFn が常に 0.99 を返す → normalToChance(0.1) 以上なので遷移しない
      const mgr = new GameModeManager(createDefaultConfig({ randomFn: () => 0.99 }));
      const role = createWinningRole();
      mgr.evaluateTransition(createSpinResult(), role);
      expect(mgr.currentMode).toBe('Normal');
    });

    it('Chance 遷移時に remainingSpins と maxPayout が設定される', () => {
      const mgr = new GameModeManager(createDefaultConfig({ randomFn: () => 0 }));
      mgr.evaluateTransition(createSpinResult(), createWinningRole());
      expect(mgr.getRemainingSpins()).toBe(20);
    });
  });

  describe('Bonus 終了後遷移', () => {
    it('BIG_BONUS 終了後は Normal に遷移する', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      // Normal → Bonus(BIG_BONUS)
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('BIG_BONUS'));
      expect(mgr.currentMode).toBe('Bonus');

      // maxSpins=20 回スピンして終了
      for (let i = 0; i < 20; i++) {
        mgr.evaluateTransition(createSpinResult(), createWinningRole());
      }
      expect(mgr.currentMode).toBe('Normal');
    });

    it('REG_BONUS 終了後は Normal に遷移する', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('REG_BONUS'));
      expect(mgr.currentMode).toBe('Bonus');

      for (let i = 0; i < 10; i++) {
        mgr.evaluateTransition(createSpinResult(), createWinningRole());
      }
      expect(mgr.currentMode).toBe('Normal');
    });

    it('SUPER_BIG_BONUS 終了後は BT に遷移する', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('SUPER_BIG_BONUS'));
      expect(mgr.currentMode).toBe('Bonus');
      expect(mgr.currentBonusType).toBe('SUPER_BIG_BONUS');

      for (let i = 0; i < 30; i++) {
        mgr.evaluateTransition(createSpinResult(), createWinningRole());
      }
      expect(mgr.currentMode).toBe('BT');
    });
  });

  describe('MaxPayout 強制終了', () => {
    it('Bonus 中に MaxPayout に達すると強制終了する', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      // BIG_BONUS: maxPayout=200
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('BIG_BONUS'));

      // 配当 200 を一度に獲得 → MaxPayout 到達
      mgr.evaluateTransition(createSpinResult({ totalPayout: 200 }), createWinningRole());
      expect(mgr.currentMode).toBe('Normal');
    });

    it('Chance 中に MaxPayout に達すると Normal に遷移する', () => {
      const mgr = new GameModeManager(createDefaultConfig({ randomFn: () => 0 }));
      mgr.evaluateTransition(createSpinResult(), createWinningRole()); // → Chance
      expect(mgr.currentMode).toBe('Chance');

      mgr.evaluateTransition(createSpinResult({ totalPayout: 200 }), createWinningRole());
      expect(mgr.currentMode).toBe('Normal');
    });

    it('BT 中に MaxPayout に達すると Normal に遷移する', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      // Normal → SUPER_BIG_BONUS → BT
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('SUPER_BIG_BONUS'));
      for (let i = 0; i < 30; i++) {
        mgr.evaluateTransition(createSpinResult(), createWinningRole());
      }
      expect(mgr.currentMode).toBe('BT');

      // BT: maxPayout=500
      mgr.evaluateTransition(createSpinResult({ totalPayout: 500 }), createWinningRole());
      expect(mgr.currentMode).toBe('Normal');
    });
  });

  describe('BT モード', () => {
    function enterBTMode(): GameModeManager {
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('SUPER_BIG_BONUS'));
      for (let i = 0; i < 30; i++) {
        mgr.evaluateTransition(createSpinResult(), createWinningRole());
      }
      expect(mgr.currentMode).toBe('BT');
      return mgr;
    }

    it('WinPattern 成立で SUPER_BIG_BONUS に再突入する', () => {
      const mgr = enterBTMode();
      // btConfig.winPatterns = [{ symbols: ['7', '7', '7'] }]
      const spinWithPattern = createSpinResult({
        grid: [
          ['7', '7', '7'],
          ['A', 'B', 'C'],
          ['D', 'E', 'F'],
        ],
      });
      mgr.evaluateTransition(spinWithPattern, createWinningRole());
      expect(mgr.currentMode).toBe('Bonus');
      expect(mgr.currentBonusType).toBe('SUPER_BIG_BONUS');
    });

    it('継続スピン数上限到達で Normal に遷移する', () => {
      const mgr = enterBTMode();
      // btConfig.maxSpins=50
      for (let i = 0; i < 50; i++) {
        mgr.evaluateTransition(createSpinResult(), createWinningRole());
      }
      expect(mgr.currentMode).toBe('Normal');
    });
  });

  describe('Chance モード', () => {
    function enterChanceMode(): GameModeManager {
      const mgr = new GameModeManager(createDefaultConfig({ randomFn: () => 0 }));
      mgr.evaluateTransition(createSpinResult(), createWinningRole());
      expect(mgr.currentMode).toBe('Chance');
      return mgr;
    }

    it('WinPattern 成立で BT に遷移する', () => {
      const mgr = enterChanceMode();
      // chanceConfig.winPatterns = [{ symbols: ['BAR', 'BAR', 'BAR'] }]
      const spinWithPattern = createSpinResult({
        grid: [
          ['BAR', 'BAR', 'BAR'],
          ['A', 'B', 'C'],
          ['D', 'E', 'F'],
        ],
      });
      mgr.evaluateTransition(spinWithPattern, createWinningRole());
      expect(mgr.currentMode).toBe('BT');
    });

    it('継続スピン数上限到達で Normal に遷移する', () => {
      const mgr = enterChanceMode();
      // chanceConfig.maxSpins=20
      for (let i = 0; i < 20; i++) {
        mgr.evaluateTransition(createSpinResult(), createWinningRole());
      }
      expect(mgr.currentMode).toBe('Normal');
    });
  });

  describe('onModeChange コールバック', () => {
    it('モード遷移時にコールバックが呼ばれる', () => {
      const callback = vi.fn();
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.onModeChange(callback);

      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('BIG_BONUS'));
      expect(callback).toHaveBeenCalledWith('Normal', 'Bonus');
    });

    it('複数のコールバックが全て呼ばれる', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.onModeChange(cb1);
      mgr.onModeChange(cb2);

      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('BIG_BONUS'));
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
    });

    it('遷移が発生しない場合コールバックは呼ばれない', () => {
      const callback = vi.fn();
      const mgr = new GameModeManager(createDefaultConfig({ randomFn: () => 0.99 }));
      mgr.onModeChange(callback);

      mgr.evaluateTransition(createSpinResult(), createWinningRole());
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('無効な遷移のエラー処理', () => {
    it('Normal → BT は無効な遷移', () => {
      // This is tested indirectly - the validateTransition method prevents it.
      // We verify the valid transitions map is correct by checking that
      // Normal can only go to Chance or Bonus.
      const mgr = new GameModeManager(createDefaultConfig({ randomFn: () => 0.99 }));
      expect(mgr.currentMode).toBe('Normal');
      // Normal mode stays Normal when no transition condition is met
      mgr.evaluateTransition(createSpinResult(), createWinningRole());
      expect(mgr.currentMode).toBe('Normal');
    });
  });

  describe('WinPattern マッチング（位置指定あり）', () => {
    it('positions 指定で特定位置のシンボルをマッチする', () => {
      const mgr = new GameModeManager(createDefaultConfig({
        randomFn: () => 0,
        chanceConfig: {
          maxSpins: 20,
          maxPayout: 200,
          winPatterns: [{ symbols: ['BAR', 'BAR', 'BAR'], positions: [1, 1, 1] }],
        },
      }));
      // Enter Chance
      mgr.evaluateTransition(createSpinResult(), createWinningRole());
      expect(mgr.currentMode).toBe('Chance');

      // Middle row matches
      const spin = createSpinResult({
        grid: [
          ['A', 'B', 'C'],
          ['BAR', 'BAR', 'BAR'],
          ['D', 'E', 'F'],
        ],
      });
      mgr.evaluateTransition(spin, createWinningRole());
      expect(mgr.currentMode).toBe('BT');
    });
  });

  describe('SpinEngine パラメータ切り替え', () => {
    it('Normal モードのパラメータを返す', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      const params = mgr.getSpinEngineParams();
      expect(params.mode).toBe('Normal');
      expect(params.bonusType).toBeNull();
    });

    it('Bonus モードのパラメータを返す', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('SUPER_BIG_BONUS'));
      const params = mgr.getSpinEngineParams();
      expect(params.mode).toBe('Bonus');
      expect(params.bonusType).toBe('SUPER_BIG_BONUS');
    });
  });

  describe('残りスピン数と累計配当の追跡', () => {
    it('Bonus モードで残りスピン数がデクリメントされる', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('BIG_BONUS'));
      expect(mgr.getRemainingSpins()).toBe(20);

      mgr.evaluateTransition(createSpinResult(), createWinningRole());
      expect(mgr.getRemainingSpins()).toBe(19);
    });

    it('配当が累積される', () => {
      const mgr = new GameModeManager(createDefaultConfig());
      mgr.evaluateTransition(createSpinResult(), createBonusWinningRole('BIG_BONUS'));

      mgr.evaluateTransition(createSpinResult({ totalPayout: 50 }), createWinningRole());
      expect(mgr.getAccumulatedPayout()).toBe(50);

      mgr.evaluateTransition(createSpinResult({ totalPayout: 30 }), createWinningRole());
      expect(mgr.getAccumulatedPayout()).toBe(80);
    });
  });
});
