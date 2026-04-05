import type { GameMode } from './game-mode';

/**
 * 閾値範囲（振り分け天井）。最小値と最大値を持ち、範囲内からランダムに閾値を決定する。
 *
 * @example
 * ```ts
 * const range: ThresholdRange = { min: 500, max: 800 };
 * ```
 */
export interface ThresholdRange {
  /** 閾値の最小値 */
  min: number;
  /** 閾値の最大値 */
  max: number;
}

/**
 * 閾値トリガー設定。対象カウンター、閾値、トリガー時のアクション、リセット条件を定義する。
 *
 * @example
 * ```ts
 * // 固定閾値
 * const fixedConfig: ThresholdConfig = {
 *   counterName: 'normalSpins',
 *   targetGameMode: 'Normal',
 *   threshold: 1000,
 *   action: 'forceBonus',
 *   resetCondition: 'BonusMode',
 * };
 *
 * // 振り分け天井
 * const rangeConfig: ThresholdConfig = {
 *   counterName: 'normalSpins',
 *   targetGameMode: 'Normal',
 *   threshold: { min: 500, max: 800 },
 *   action: 'forceChance',
 *   resetCondition: 'BonusMode',
 * };
 * ```
 */
export interface ThresholdConfig {
  /** 対象カウンター名 */
  counterName: string;
  /** カウント対象のGameMode */
  targetGameMode: GameMode;
  /** 閾値（固定値またはThresholdRange） */
  threshold: number | ThresholdRange;
  /** 閾値到達時に実行するアクション名 */
  action: string;
  /** カウンターリセット条件 */
  resetCondition: string;
}
