import type { GamePhase } from '../types/game-phase';
import type { SpinResult, StopTiming } from '../types/spin';
import type { WinningRole, GameMode } from '../types/game-mode';
import type { EventEmitter } from '../infrastructure/event-emitter';
import type { SpinEngine } from '../core/spin-engine';
import type { InternalLottery } from '../core/internal-lottery';
import type { CreditManager } from './credit-manager';
import type { GameModeManager } from './game-mode-manager';
import type { NotificationManager } from './notification-manager';
import type { ZoneManager } from './zone-manager';
import type { SpinCounter } from './spin-counter';

/**
 * 依存モジュールを注入する設定オブジェクト。各モジュールはオプショナル — 未提供時はスキップされる。
 *
 * @example
 * ```ts
 * const config: GameCycleManagerConfig = {
 *   spinEngine: mySpinEngine,
 *   creditManager: myCreditManager,
 *   gameModeManager: myGameModeManager,
 *   eventEmitter: myEventEmitter,
 * };
 * ```
 */
export interface GameCycleManagerConfig {
  spinEngine?: SpinEngine;
  creditManager?: CreditManager;
  gameModeManager?: GameModeManager;
  notificationManager?: NotificationManager;
  zoneManager?: ZoneManager;
  spinCounter?: SpinCounter;
  eventEmitter?: EventEmitter;
  internalLottery?: InternalLottery;
}

/** 14フェーズの順序定義 */
const PHASE_ORDER: GamePhase[] = [
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
];

/**
 * 1ゲームのライフサイクルを統合管理するオーケストレーター。
 *
 * BET→LEVER_ON→INTERNAL_LOTTERY→NOTIFICATION_CHECK→REEL_SPINNING→
 * STOP_OPERATION→REEL_STOPPED→RESULT_CONFIRMED→WIN_JUDGE→PAYOUT→
 * MODE_TRANSITION→ZONE_UPDATE→COUNTER_UPDATE→WAITING の14フェーズを順序管理し、
 * 各フェーズで対応するモジュールを呼び出す。
 *
 * @example
 * ```ts
 * const manager = new GameCycleManager({
 *   spinEngine: mySpinEngine,
 *   creditManager: myCreditManager,
 * });
 * manager.onPhaseChange((from, to) => console.log(`${from} → ${to}`));
 * manager.startCycle();
 * ```
 */
export class GameCycleManager {
  private _currentPhase: GamePhase = 'WAITING';
  private _phaseChangeCallbacks: Array<(from: GamePhase, to: GamePhase) => void> = [];
  private _isReplay = false;

  // 1ゲーム中の状態
  private _currentWinningRole: WinningRole | null = null;
  private _currentSpinResult: SpinResult | null = null;
  private _stopTimings: StopTiming[] = [];

  // 依存モジュール
  private readonly spinEngine?: SpinEngine;
  private readonly creditManager?: CreditManager;
  private readonly gameModeManager?: GameModeManager;
  private readonly notificationManager?: NotificationManager;
  private readonly zoneManager?: ZoneManager;
  private readonly spinCounter?: SpinCounter;
  private readonly eventEmitter?: EventEmitter;
  private readonly internalLottery?: InternalLottery;

  constructor(config: GameCycleManagerConfig) {
    this.spinEngine = config.spinEngine;
    this.creditManager = config.creditManager;
    this.gameModeManager = config.gameModeManager;
    this.notificationManager = config.notificationManager;
    this.zoneManager = config.zoneManager;
    this.spinCounter = config.spinCounter;
    this.eventEmitter = config.eventEmitter;
    this.internalLottery = config.internalLottery;
  }

  /** 現在のGamePhase */
  get currentPhase(): GamePhase {
    return this._currentPhase;
  }

  /** 現在のスピンがリプレイかどうか */
  get isReplay(): boolean {
    return this._isReplay;
  }

  /**
   * ゲームサイクル開始。リプレイ時はBETをスキップしてLEVER_ONから開始する。
   */
  startCycle(): void {
    this._stopTimings = [];
    this._currentSpinResult = null;

    if (this._isReplay) {
      this.transitionTo('LEVER_ON');
    } else {
      this.transitionTo('BET');
    }
  }

  /**
   * フェーズ遷移コールバック登録。フェーズ遷移時に遷移元・遷移先を受け取るコールバックを登録する。
   *
   * @param callback - 遷移元フェーズと遷移先フェーズを受け取るコールバック
   */
  onPhaseChange(callback: (from: GamePhase, to: GamePhase) => void): void {
    this._phaseChangeCallbacks.push(callback);
  }

  /**
   * ストップ操作通知。プレイヤーのストップボタン押下を記録する。
   *
   * @param reelIndex - リールインデックス
   * @param timing - 停止タイミング
   */
  notifyStop(reelIndex: number, timing: StopTiming): void {
    this._stopTimings[reelIndex] = timing;
  }

  /**
   * 次のフェーズへ進む
   */
  advancePhase(): void {
    const currentIndex = PHASE_ORDER.indexOf(this._currentPhase);
    if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) {
      return;
    }
    const nextPhase = PHASE_ORDER[currentIndex + 1];
    this.transitionTo(nextPhase);
  }

  /**
   * フェーズ遷移を実行し、対応するモジュールを呼び出す
   */
  private transitionTo(phase: GamePhase): void {
    const from = this._currentPhase;
    this._currentPhase = phase;

    // コールバック発火
    for (const cb of this._phaseChangeCallbacks) {
      cb(from, phase);
    }

    // EventEmitter でフェーズ遷移イベントを発火
    this.eventEmitter?.emit('phaseChange', { from, to: phase });

    // フェーズ固有の処理
    this.executePhase(phase);
  }

  /**
   * 各フェーズに対応するモジュール呼び出し
   */
  private executePhase(phase: GamePhase): void {
    switch (phase) {
      case 'BET':
        this.executeBet();
        break;
      case 'INTERNAL_LOTTERY':
        this.executeInternalLottery();
        break;
      case 'NOTIFICATION_CHECK':
        this.executeNotificationCheck();
        break;
      case 'REEL_SPINNING':
        this.executeReelSpinning();
        break;
      case 'WIN_JUDGE':
        this.executeWinJudge();
        break;
      case 'PAYOUT':
        this.executePayout();
        break;
      case 'MODE_TRANSITION':
        this.executeModeTransition();
        break;
      case 'ZONE_UPDATE':
        this.executeZoneUpdate();
        break;
      case 'COUNTER_UPDATE':
        this.executeCounterUpdate();
        break;
      case 'WAITING':
        this.executeWaiting();
        break;
      default:
        // LEVER_ON, STOP_OPERATION, REEL_STOPPED, RESULT_CONFIRMED
        // — no automatic module calls, controlled externally
        break;
    }
  }

  /** BETフェーズ: CreditManager.bet() */
  private executeBet(): void {
    this.creditManager?.bet();
  }

  /** INTERNAL_LOTTERYフェーズ: InternalLottery.draw() */
  private executeInternalLottery(): void {
    if (this.internalLottery) {
      const gameMode: GameMode = this.gameModeManager?.currentMode ?? 'Normal';
      this._currentWinningRole = this.internalLottery.draw(gameMode);
    }
  }

  /** NOTIFICATION_CHECKフェーズ: NotificationManager.check() */
  private executeNotificationCheck(): void {
    if (this.notificationManager && this._currentWinningRole) {
      this.notificationManager.check('PRE_SPIN', this._currentWinningRole);
    }
  }

  /** REEL_SPINNINGフェーズ: SpinEngine でスピン開始 */
  private executeReelSpinning(): void {
    if (this.spinEngine && this._currentWinningRole) {
      this._currentSpinResult = this.spinEngine.spin(
        this._currentWinningRole,
        this._stopTimings.length > 0 ? this._stopTimings : undefined,
      );
    }
    this.eventEmitter?.emit('spinStart');
  }

  /** WIN_JUDGEフェーズ: Payline評価（SpinResult内で既に評価済み） */
  private executeWinJudge(): void {
    if (this._currentSpinResult && this._currentSpinResult.winLines.length > 0) {
      this.eventEmitter?.emit('win', {
        totalPayout: this._currentSpinResult.totalPayout,
        winLines: this._currentSpinResult.winLines,
      });
    }
  }

  /** PAYOUTフェーズ: CreditManager.payout() */
  private executePayout(): void {
    if (this.creditManager && this._currentSpinResult) {
      if (this._currentSpinResult.totalPayout > 0) {
        this.creditManager.payout(this._currentSpinResult.totalPayout);
      }
    }
  }

  /** MODE_TRANSITIONフェーズ: GameModeManager.evaluateTransition() */
  private executeModeTransition(): void {
    if (this.gameModeManager && this._currentSpinResult && this._currentWinningRole) {
      this.gameModeManager.evaluateTransition(this._currentSpinResult, this._currentWinningRole);
    }
  }

  /** ZONE_UPDATEフェーズ: ZoneManager.update() */
  private executeZoneUpdate(): void {
    if (this.zoneManager && this._currentSpinResult) {
      this.zoneManager.update(this._currentSpinResult);
    }
  }

  /** COUNTER_UPDATEフェーズ: SpinCounter.increment() */
  private executeCounterUpdate(): void {
    if (this.spinCounter) {
      const gameMode: GameMode = this.gameModeManager?.currentMode ?? 'Normal';
      this.spinCounter.increment(gameMode);
    }
  }

  /** WAITINGフェーズ: リプレイ判定 */
  private executeWaiting(): void {
    if (this._currentSpinResult?.isReplay) {
      this._isReplay = true;
    } else {
      this._isReplay = false;
    }
  }
}

export { PHASE_ORDER };
