import type { WinningRole, WinningRoleType } from './game-mode';
import type { SpinResult } from './spin';

/**
 * 告知タイミング。告知イベントが発火するタイミングを表す。
 *
 * - `PRE_SPIN` — スピン開始前の先告知
 * - `POST_SPIN` — リール停止後の後告知
 * - `NEXT_BET` — 次ゲームBET時の告知
 * - `LEVER_ON` — レバーON時の告知
 *
 * @example
 * ```ts
 * const timing: NotificationType = 'PRE_SPIN';
 * ```
 */
export type NotificationType = 'PRE_SPIN' | 'POST_SPIN' | 'NEXT_BET' | 'LEVER_ON';

/**
 * 告知ペイロード。告知イベント発火時にコールバックへ渡されるデータ。
 *
 * @example
 * ```ts
 * const payload: NotificationPayload = {
 *   type: 'PRE_SPIN',
 *   winningRole: { id: 'big_bonus', name: 'BIG BONUS', type: 'BONUS', payout: 0, patterns: [], priority: 90 },
 *   timestamp: Date.now(),
 * };
 * ```
 */
export interface NotificationPayload {
  /** 告知タイミング */
  type: NotificationType;
  /** 告知対象の当選役 */
  winningRole: WinningRole;
  /** スピン結果（POST_SPIN時に含まれる） */
  spinResult?: SpinResult;
  /** 告知発火時のタイムスタンプ */
  timestamp: number;
}

/**
 * 告知設定。各告知タイミングの有効/無効、告知対象の当選役種別、コールバックを定義する。
 *
 * @example
 * ```ts
 * const config: NotificationConfig = {
 *   enabledTypes: { PRE_SPIN: true, POST_SPIN: false, NEXT_BET: true, LEVER_ON: false },
 *   targetRoleTypes: ['BONUS'],
 *   onNotification: (payload) => console.log('告知:', payload.type),
 * };
 * ```
 */
export interface NotificationConfig {
  /** 各NotificationTypeの有効/無効設定 */
  enabledTypes: Partial<Record<NotificationType, boolean>>;
  /** 告知対象とするWinningRoleTypeの一覧 */
  targetRoleTypes: WinningRoleType[];
  /** 告知発火時のコールバック */
  onNotification?: (payload: NotificationPayload) => void;
  /** NotificationTypeごとの個別コールバック */
  callbacks?: Partial<Record<NotificationType, (payload: NotificationPayload) => void>>;
}
