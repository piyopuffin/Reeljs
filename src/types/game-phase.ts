import type { WinningRole } from './game-mode';

/**
 * ゲームサイクルフェーズ。1ゲームのライフサイクルにおける各段階を表す。
 *
 * フェーズ順序:
 * BET → LEVER_ON → INTERNAL_LOTTERY → NOTIFICATION_CHECK → REEL_SPINNING →
 * STOP_OPERATION → REEL_STOPPED → RESULT_CONFIRMED → WIN_JUDGE → PAYOUT →
 * MODE_TRANSITION → ZONE_UPDATE → COUNTER_UPDATE → WAITING
 *
 * @example
 * ```ts
 * const phase: GamePhase = 'REEL_SPINNING';
 * ```
 */
export type GamePhase =
  | 'BET'
  | 'LEVER_ON'
  | 'INTERNAL_LOTTERY'
  | 'NOTIFICATION_CHECK'
  | 'REEL_SPINNING'
  | 'STOP_OPERATION'
  | 'REEL_STOPPED'
  | 'RESULT_CONFIRMED'
  | 'WIN_JUDGE'
  | 'PAYOUT'
  | 'MODE_TRANSITION'
  | 'ZONE_UPDATE'
  | 'COUNTER_UPDATE'
  | 'WAITING';

/**
 * リプレイ型。WinningRoleType が 'REPLAY' である当選役を表す。
 * リプレイ当選時はBETを消費せず自動的に次のスピンを開始する。
 *
 * @example
 * ```ts
 * const replay: Replay = {
 *   id: 'replay',
 *   name: 'リプレイ',
 *   type: 'REPLAY',
 *   payout: 0,
 *   patterns: [['replay', 'replay', 'replay']],
 *   priority: 5,
 * };
 * ```
 */
export type Replay = WinningRole & { type: 'REPLAY' };
