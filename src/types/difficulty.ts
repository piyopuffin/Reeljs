import type { ModeTransitionConfig } from './game-mode';

/**
 * 設定段階パラメータ。各設定段階における内部抽選確率・モード遷移確率・リプレイ確率を定義する。
 *
 * @example
 * ```ts
 * const config: DifficultyConfig = {
 *   level: 1,
 *   lotteryProbabilities: { cherry: 0.12, bell: 0.08, replay: 0.16 },
 *   transitionProbabilities: { normalToChance: 0.01 },
 *   replayProbability: 0.16,
 * };
 * ```
 */
export interface DifficultyConfig {
  /** 設定段階番号 */
  level: number;
  /** 内部抽選確率（小役ID → 確率） */
  lotteryProbabilities: Record<string, number>;
  /** モード遷移確率の上書き */
  transitionProbabilities: Partial<ModeTransitionConfig>;
  /** リプレイ確率 */
  replayProbability: number;
}

/**
 * 設定段階プリセット設定。全設定段階のパラメータと初期設定段階を定義する。
 *
 * @example
 * ```ts
 * const preset: DifficultyPresetConfig = {
 *   levels: {
 *     1: { level: 1, lotteryProbabilities: { cherry: 0.12 }, transitionProbabilities: {}, replayProbability: 0.16 },
 *     6: { level: 6, lotteryProbabilities: { cherry: 0.15 }, transitionProbabilities: {}, replayProbability: 0.18 },
 *   },
 *   initialLevel: 1,
 * };
 * ```
 */
export interface DifficultyPresetConfig {
  /** 設定段階ごとのパラメータ */
  levels: Record<number, DifficultyConfig>;
  /** 初期設定段階 */
  initialLevel: number;
}
