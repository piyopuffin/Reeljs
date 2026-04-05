import type {
  NotificationType,
  NotificationPayload,
  NotificationConfig,
} from '../types/notification';
import type { WinningRole, WinningRoleType } from '../types/game-mode';
import type { SpinResult } from '../types/spin';

/** 有効な NotificationType の一覧 */
const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'PRE_SPIN',
  'POST_SPIN',
  'NEXT_BET',
  'LEVER_ON',
];

/**
 * 告知タイミング判定・イベント発火モジュール。
 * InternalLottery の WinningRole 結果に基づき、設定された告知タイミングで
 * onNotification コールバックを発火する。演出（UI/アニメーション/サウンド）は
 * 提供せず、ロジックとイベント発火のみを担当する。
 *
 * @example
 * ```ts
 * const manager = new NotificationManager({
 *   enabledTypes: { PRE_SPIN: true, NEXT_BET: true },
 *   targetRoleTypes: ['BONUS'],
 *   onNotification: (payload) => console.log('告知:', payload.type, payload.winningRole.name),
 * });
 * manager.check('PRE_SPIN', bonusRole);
 * ```
 */
export class NotificationManager {
  private readonly enabledTypes: Map<NotificationType, boolean>;
  private readonly targetRoleTypes: Set<WinningRoleType>;
  private readonly onNotificationCallback?: (payload: NotificationPayload) => void;
  private previousWin: WinningRole | null = null;

  constructor(config: NotificationConfig) {
    this.validateConfig(config);

    this.enabledTypes = new Map<NotificationType, boolean>();
    for (const type of VALID_NOTIFICATION_TYPES) {
      this.enabledTypes.set(type, config.enabledTypes[type] ?? false);
    }

    this.targetRoleTypes = new Set(config.targetRoleTypes);
    this.onNotificationCallback = config.onNotification;
  }

  /**
   * 告知判定実行
   *
   * 指定されたタイミングで告知条件を評価し、条件を満たす場合に
   * onNotification コールバックを発火する。
   *
   * @param timing 告知タイミング
   * @param winningRole 当選役（PRE_SPIN, POST_SPIN, LEVER_ON で使用）
   * @param spinResult スピン結果（POST_SPIN で使用）
   */
  check(
    timing: NotificationType,
    winningRole?: WinningRole,
    spinResult?: SpinResult
  ): void {
    if (!VALID_NOTIFICATION_TYPES.includes(timing)) {
      throw new Error(`Invalid NotificationType: ${String(timing)}`);
    }

    if (!this.enabledTypes.get(timing)) {
      return;
    }

    switch (timing) {
      case 'PRE_SPIN':
      case 'LEVER_ON':
        this.handleCurrentGameNotification(timing, winningRole);
        break;
      case 'POST_SPIN':
        this.handlePostSpinNotification(winningRole, spinResult);
        break;
      case 'NEXT_BET':
        this.handleNextBetNotification();
        break;
    }
  }

  /**
   * 前ゲーム当選情報を保持する（NEXT_BET 告知用）
   * @param winningRole 前ゲームの当選役
   */
  setPreviousWin(winningRole: WinningRole): void {
    this.previousWin = winningRole;
  }

  /**
   * 前ゲーム当選情報をクリアする
   */
  clearPreviousWin(): void {
    this.previousWin = null;
  }

  /**
   * PRE_SPIN / LEVER_ON 告知処理
   */
  private handleCurrentGameNotification(
    timing: NotificationType,
    winningRole?: WinningRole
  ): void {
    if (!winningRole) {
      return;
    }
    if (!this.isTargetRole(winningRole)) {
      return;
    }
    this.fireNotification(timing, winningRole);
  }

  /**
   * POST_SPIN 告知処理
   */
  private handlePostSpinNotification(
    winningRole?: WinningRole,
    spinResult?: SpinResult
  ): void {
    if (!winningRole) {
      return;
    }
    if (!this.isTargetRole(winningRole)) {
      return;
    }
    this.fireNotification('POST_SPIN', winningRole, spinResult);
  }

  /**
   * NEXT_BET 告知処理: 前ゲーム当選情報に基づき告知し、発火後にクリアする
   */
  private handleNextBetNotification(): void {
    if (!this.previousWin) {
      return;
    }
    if (!this.isTargetRole(this.previousWin)) {
      this.previousWin = null;
      return;
    }
    const win = this.previousWin;
    this.previousWin = null;
    this.fireNotification('NEXT_BET', win);
  }

  /**
   * 当選役が告知対象かどうかを判定する
   */
  private isTargetRole(winningRole: WinningRole): boolean {
    return this.targetRoleTypes.has(winningRole.type);
  }

  /**
   * onNotification コールバックを発火する
   */
  private fireNotification(
    type: NotificationType,
    winningRole: WinningRole,
    spinResult?: SpinResult
  ): void {
    if (!this.onNotificationCallback) {
      return;
    }
    const payload: NotificationPayload = {
      type,
      winningRole,
      timestamp: Date.now(),
      ...(spinResult !== undefined && { spinResult }),
    };
    this.onNotificationCallback(payload);
  }

  /**
   * NotificationConfig のバリデーション
   */
  private validateConfig(config: NotificationConfig): void {
    if (config.enabledTypes) {
      for (const key of Object.keys(config.enabledTypes)) {
        if (!VALID_NOTIFICATION_TYPES.includes(key as NotificationType)) {
          throw new Error(
            `Invalid NotificationType in enabledTypes: ${key}. Valid types: [${VALID_NOTIFICATION_TYPES.join(', ')}]`
          );
        }
      }
    }

    if (config.onNotification !== undefined && typeof config.onNotification !== 'function') {
      throw new Error('onNotification must be a function');
    }
  }
}
