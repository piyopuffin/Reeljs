import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameCycleManager, PHASE_ORDER } from './game-cycle-manager';
import type { GameCycleManagerConfig } from './game-cycle-manager';
import type { GamePhase } from '../types/game-phase';
import type { SpinResult } from '../types/spin';
import type { WinningRole } from '../types/game-mode';

/** ヘルパー: MISS 用 WinningRole */
const MISS_ROLE: WinningRole = {
  id: 'miss',
  name: 'ハズレ',
  type: 'MISS',
  payout: 0,
  patterns: [],
  priority: 0,
};

/** ヘルパー: REPLAY 用 WinningRole */
const REPLAY_ROLE: WinningRole = {
  id: 'replay',
  name: 'リプレイ',
  type: 'REPLAY',
  payout: 0,
  patterns: [['replay', 'replay', 'replay']],
  priority: 5,
};

/** ヘルパー: 基本的な SpinResult */
function makeSpinResult(overrides: Partial<SpinResult> = {}): SpinResult {
  return {
    grid: [['a', 'b', 'c']],
    stopResults: [],
    winLines: [],
    totalPayout: 0,
    isReplay: false,
    isMiss: false,
    winningRole: MISS_ROLE,
    ...overrides,
  };
}

/** ヘルパー: モック依存モジュール群を生成 */
function createMockDeps(): GameCycleManagerConfig {
  return {
    creditManager: {
      balance: 100,
      currentBet: 3,
      bet: vi.fn(() => true),
      payout: vi.fn(),
      deposit: vi.fn(),
      withdraw: vi.fn(() => true),
      setBet: vi.fn(),
      getHistory: vi.fn(() => []),
      getState: vi.fn(),
    } as any,
    internalLottery: {
      draw: vi.fn(() => MISS_ROLE),
      getCarryOverFlag: vi.fn(() => null),
      clearCarryOver: vi.fn(),
      setCarryOver: vi.fn(),
    } as any,
    notificationManager: {
      check: vi.fn(),
      setPreviousWin: vi.fn(),
      clearPreviousWin: vi.fn(),
    } as any,
    spinEngine: {
      spin: vi.fn(() => makeSpinResult()),
      lottery: vi.fn(),
      controlReels: vi.fn(),
      evaluatePaylines: vi.fn(() => []),
    } as any,
    gameModeManager: {
      currentMode: 'Normal' as const,
      currentBonusType: null,
      evaluateTransition: vi.fn(() => 'Normal'),
      onModeChange: vi.fn(),
      getRemainingSpins: vi.fn(() => null),
      getSpinEngineParams: vi.fn(),
    } as any,
    zoneManager: {
      currentState: { currentZone: 'normal', gamesPlayed: 0, netCredits: 0 },
      indicator: { isSpecialZone: false, zoneName: '通常区間' },
      update: vi.fn(),
      onZoneChange: vi.fn(),
      onReset: vi.fn(),
    } as any,
    spinCounter: {
      get: vi.fn(() => 0),
      increment: vi.fn(),
      reset: vi.fn(),
      getAll: vi.fn(() => ({})),
    } as any,
    eventEmitter: {
      emit: vi.fn(),
      on: vi.fn(() => vi.fn()),
      off: vi.fn(),
    } as any,
  };
}

describe('GameCycleManager', () => {
  let deps: GameCycleManagerConfig;
  let manager: GameCycleManager;

  beforeEach(() => {
    deps = createMockDeps();
    manager = new GameCycleManager(deps);
  });

  describe('初期状態', () => {
    it('初期フェーズは WAITING', () => {
      expect(manager.currentPhase).toBe('WAITING');
    });

    it('初期状態で isReplay は false', () => {
      expect(manager.isReplay).toBe(false);
    });
  });

  describe('PHASE_ORDER', () => {
    it('14フェーズが正しい順序で定義されている', () => {
      expect(PHASE_ORDER).toEqual([
        'BET',
        'LEVER_ON',
        'INTERNAL_LOTTERY',
        'NOTIFICATION_CHECK',
        'REEL_SPINNING',
        'STOP_OPERATION',
        'REEL_STOPPED',
        'RESULT_CONFIRMED',
        'WIN_JUDGE',
        'PAYOUT',
        'MODE_TRANSITION',
        'ZONE_UPDATE',
        'COUNTER_UPDATE',
        'WAITING',
      ]);
      expect(PHASE_ORDER).toHaveLength(14);
    });
  });

  describe('startCycle', () => {
    it('通常時は BET フェーズから開始する', () => {
      manager.startCycle();
      expect(manager.currentPhase).toBe('BET');
    });

    it('BET フェーズで CreditManager.bet() が呼ばれる', () => {
      manager.startCycle();
      expect(deps.creditManager!.bet).toHaveBeenCalled();
    });
  });

  describe('onPhaseChange', () => {
    it('フェーズ遷移時にコールバックが呼ばれる', () => {
      const callback = vi.fn();
      manager.onPhaseChange(callback);
      manager.startCycle();
      expect(callback).toHaveBeenCalledWith('WAITING', 'BET');
    });

    it('複数のコールバックが登録可能', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      manager.onPhaseChange(cb1);
      manager.onPhaseChange(cb2);
      manager.startCycle();
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });
  });

  describe('advancePhase', () => {
    it('BET → LEVER_ON へ遷移する', () => {
      manager.startCycle();
      manager.advancePhase();
      expect(manager.currentPhase).toBe('LEVER_ON');
    });

    it('全14フェーズを順番に遷移できる', () => {
      const phases: GamePhase[] = [];
      manager.onPhaseChange((_from, to) => phases.push(to));

      manager.startCycle(); // → BET
      for (let i = 0; i < 13; i++) {
        manager.advancePhase();
      }

      expect(phases).toEqual(PHASE_ORDER);
    });

    it('WAITING フェーズで advancePhase しても遷移しない', () => {
      manager.startCycle();
      // Advance through all phases to WAITING
      for (let i = 0; i < 13; i++) {
        manager.advancePhase();
      }
      expect(manager.currentPhase).toBe('WAITING');
      manager.advancePhase();
      expect(manager.currentPhase).toBe('WAITING');
    });
  });

  describe('INTERNAL_LOTTERY フェーズ', () => {
    it('InternalLottery.draw() が呼ばれる', () => {
      manager.startCycle();
      manager.advancePhase(); // LEVER_ON
      manager.advancePhase(); // INTERNAL_LOTTERY
      expect(deps.internalLottery!.draw).toHaveBeenCalledWith('Normal');
    });

    it('GameModeManager の currentMode が使用される', () => {
      (deps.gameModeManager as any).currentMode = 'Bonus';
      manager.startCycle();
      manager.advancePhase(); // LEVER_ON
      manager.advancePhase(); // INTERNAL_LOTTERY
      expect(deps.internalLottery!.draw).toHaveBeenCalledWith('Bonus');
    });
  });

  describe('NOTIFICATION_CHECK フェーズ', () => {
    it('NotificationManager.check() が当選役とともに呼ばれる', () => {
      const bonusRole: WinningRole = {
        id: 'big_bonus',
        name: 'BIG BONUS',
        type: 'BONUS',
        bonusType: 'BIG_BONUS',
        payout: 0,
        patterns: [['bar', 'bar', 'bar']],
        priority: 90,
      };
      (deps.internalLottery as any).draw = vi.fn(() => bonusRole);

      manager.startCycle();
      manager.advancePhase(); // LEVER_ON
      manager.advancePhase(); // INTERNAL_LOTTERY
      manager.advancePhase(); // NOTIFICATION_CHECK

      expect(deps.notificationManager!.check).toHaveBeenCalledWith('PRE_SPIN', bonusRole);
    });
  });

  describe('REEL_SPINNING フェーズ', () => {
    it('SpinEngine.spin() が当選役とともに呼ばれる', () => {
      manager.startCycle();
      manager.advancePhase(); // LEVER_ON
      manager.advancePhase(); // INTERNAL_LOTTERY
      manager.advancePhase(); // NOTIFICATION_CHECK
      manager.advancePhase(); // REEL_SPINNING

      expect(deps.spinEngine!.spin).toHaveBeenCalledWith(MISS_ROLE, undefined);
    });

    it('spinStart イベントが発火される', () => {
      manager.startCycle();
      manager.advancePhase(); // LEVER_ON
      manager.advancePhase(); // INTERNAL_LOTTERY
      manager.advancePhase(); // NOTIFICATION_CHECK
      manager.advancePhase(); // REEL_SPINNING

      expect(deps.eventEmitter!.emit).toHaveBeenCalledWith('spinStart');
    });
  });

  describe('notifyStop', () => {
    it('ストップタイミングが記録される', () => {
      manager.startCycle();
      manager.advancePhase(); // LEVER_ON
      manager.advancePhase(); // INTERNAL_LOTTERY
      manager.advancePhase(); // NOTIFICATION_CHECK

      // REEL_SPINNING 前にストップタイミングを通知
      manager.notifyStop(0, 5);
      manager.notifyStop(1, 10);
      manager.notifyStop(2, 15);

      manager.advancePhase(); // REEL_SPINNING

      expect(deps.spinEngine!.spin).toHaveBeenCalledWith(MISS_ROLE, [5, 10, 15]);
    });
  });

  describe('WIN_JUDGE フェーズ', () => {
    it('当選時に win イベントが発火される', () => {
      const result = makeSpinResult({
        totalPayout: 10,
        winLines: [{ lineIndex: 0, matchedSymbols: ['a', 'a', 'a'], payout: 10, payline: { index: 0, positions: [0, 0, 0] } }],
      });
      (deps.spinEngine as any).spin = vi.fn(() => result);

      manager.startCycle();
      for (let i = 0; i < 8; i++) manager.advancePhase(); // → WIN_JUDGE

      expect(deps.eventEmitter!.emit).toHaveBeenCalledWith('win', {
        totalPayout: 10,
        winLines: result.winLines,
      });
    });

    it('非当選時は win イベントが発火されない', () => {
      manager.startCycle();
      for (let i = 0; i < 8; i++) manager.advancePhase(); // → WIN_JUDGE

      const winCalls = (deps.eventEmitter!.emit as any).mock.calls.filter(
        (c: any[]) => c[0] === 'win',
      );
      expect(winCalls).toHaveLength(0);
    });
  });

  describe('PAYOUT フェーズ', () => {
    it('配当がある場合 CreditManager.payout() が呼ばれる', () => {
      const result = makeSpinResult({ totalPayout: 20 });
      (deps.spinEngine as any).spin = vi.fn(() => result);

      manager.startCycle();
      for (let i = 0; i < 9; i++) manager.advancePhase(); // → PAYOUT

      expect(deps.creditManager!.payout).toHaveBeenCalledWith(20);
    });

    it('配当が0の場合 CreditManager.payout() は呼ばれない', () => {
      manager.startCycle();
      for (let i = 0; i < 9; i++) manager.advancePhase(); // → PAYOUT

      expect(deps.creditManager!.payout).not.toHaveBeenCalled();
    });
  });

  describe('MODE_TRANSITION フェーズ', () => {
    it('GameModeManager.evaluateTransition() が呼ばれる', () => {
      manager.startCycle();
      for (let i = 0; i < 10; i++) manager.advancePhase(); // → MODE_TRANSITION

      expect(deps.gameModeManager!.evaluateTransition).toHaveBeenCalled();
    });
  });

  describe('ZONE_UPDATE フェーズ', () => {
    it('ZoneManager.update() が SpinResult とともに呼ばれる', () => {
      const result = makeSpinResult();
      (deps.spinEngine as any).spin = vi.fn(() => result);

      manager.startCycle();
      for (let i = 0; i < 11; i++) manager.advancePhase(); // → ZONE_UPDATE

      expect(deps.zoneManager!.update).toHaveBeenCalledWith(result);
    });
  });

  describe('COUNTER_UPDATE フェーズ', () => {
    it('SpinCounter.increment() が現在の GameMode で呼ばれる', () => {
      manager.startCycle();
      for (let i = 0; i < 12; i++) manager.advancePhase(); // → COUNTER_UPDATE

      expect(deps.spinCounter!.increment).toHaveBeenCalledWith('Normal');
    });
  });

  describe('EventEmitter 連携', () => {
    it('各フェーズ遷移時に phaseChange イベントが発火される', () => {
      manager.startCycle();

      expect(deps.eventEmitter!.emit).toHaveBeenCalledWith('phaseChange', {
        from: 'WAITING',
        to: 'BET',
      });
    });
  });

  describe('Replay（リプレイ）', () => {
    it('Replay 当選時に isReplay が true になる', () => {
      const replayResult = makeSpinResult({ isReplay: true, winningRole: REPLAY_ROLE });
      (deps.spinEngine as any).spin = vi.fn(() => replayResult);

      manager.startCycle();
      for (let i = 0; i < 13; i++) manager.advancePhase(); // → WAITING

      expect(manager.isReplay).toBe(true);
    });

    it('Replay 時に startCycle で BET をスキップして LEVER_ON から開始する', () => {
      const replayResult = makeSpinResult({ isReplay: true, winningRole: REPLAY_ROLE });
      (deps.spinEngine as any).spin = vi.fn(() => replayResult);

      // 1ゲーム目: Replay 当選
      manager.startCycle();
      for (let i = 0; i < 13; i++) manager.advancePhase(); // → WAITING

      // 2ゲーム目: BET スキップ
      const phases: GamePhase[] = [];
      manager.onPhaseChange((_from, to) => phases.push(to));
      manager.startCycle();

      expect(manager.currentPhase).toBe('LEVER_ON');
      expect(phases[0]).toBe('LEVER_ON');
      // BET が呼ばれていないことを確認（1ゲーム目の1回のみ）
      expect(deps.creditManager!.bet).toHaveBeenCalledTimes(1);
    });

    it('非 Replay 時は isReplay が false のまま', () => {
      manager.startCycle();
      for (let i = 0; i < 13; i++) manager.advancePhase(); // → WAITING

      expect(manager.isReplay).toBe(false);
    });
  });

  describe('依存モジュール未提供時のグレースフルハンドリング', () => {
    it('全モジュール未提供でもエラーなくサイクルを完走できる', () => {
      const emptyManager = new GameCycleManager({});

      expect(() => {
        emptyManager.startCycle();
        for (let i = 0; i < 13; i++) {
          emptyManager.advancePhase();
        }
      }).not.toThrow();

      expect(emptyManager.currentPhase).toBe('WAITING');
    });
  });
});
