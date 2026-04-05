import type { Payline } from './payline';
import type { WinningRole } from './game-mode';

/**
 * 引き込み範囲。各リールで引き込み可能な最大コマ数を表す。
 * デフォルトは最大4コマ。
 *
 * @example
 * ```ts
 * const slipRange: SlipRange = 4; // 最大4コマ引き込み
 * ```
 */
export type SlipRange = number;

/**
 * プレイヤーの停止タイミング。リール上の位置（シンボルインデックス）として表現される。
 * ストップボタン押下時のリール位置を示す。
 *
 * @example
 * ```ts
 * const timing: StopTiming = 5; // リールストリップのインデックス5で停止操作
 * ```
 */
export type StopTiming = number;

/**
 * 各リールの停止結果。狙った位置、実際の停止位置、引き込みコマ数、取りこぼし判定を含む。
 *
 * @example
 * ```ts
 * const result: StopResult = {
 *   reelIndex: 0,
 *   targetPosition: 3,
 *   actualPosition: 5,
 *   slipCount: 2,
 *   isMiss: false,
 * };
 * ```
 */
export interface StopResult {
  /** リールインデックス（0始まり） */
  reelIndex: number;
  /** プレイヤーが狙った位置 */
  targetPosition: number;
  /** 実際の停止位置（引き込み・蹴飛ばし適用後） */
  actualPosition: number;
  /** 引き込みコマ数 */
  slipCount: number;
  /** 取りこぼしかどうか */
  isMiss: boolean;
}

/**
 * 当選ライン結果。当選したPaylineの情報と配当額を含む。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const paylineResult: PaylineResult = {
 *   lineIndex: 0,
 *   matchedSymbols: ['cherry', 'cherry', 'cherry'],
 *   payout: 10,
 *   payline: { index: 0, positions: [1, 1, 1] },
 * };
 * ```
 */
export interface PaylineResult<S extends string = string> {
  /** 当選したライン番号 */
  lineIndex: number;
  /** 一致したシンボルの配列 */
  matchedSymbols: S[];
  /** このラインの配当額 */
  payout: number;
  /** 当選したPayline定義 */
  payline: Payline;
}

/**
 * 1回のスピン結果。グリッド、停止結果、当選ライン、配当、リプレイ・取りこぼし情報を含む。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const spinResult: SpinResult = {
 *   grid: [['cherry', 'bell', 'bar'], ['bell', 'bell', 'bell'], ['bar', 'cherry', 'seven']],
 *   stopResults: [],
 *   winLines: [],
 *   totalPayout: 8,
 *   isReplay: false,
 *   isMiss: false,
 *   winningRole: { id: 'bell', name: 'ベル', type: 'SMALL_WIN', payout: 8, patterns: [], priority: 30 },
 * };
 * ```
 */
export interface SpinResult<S extends string = string> {
  /** 各リールの停止シンボル（grid[row][reel]） */
  grid: S[][];
  /** 各リールの停止結果 */
  stopResults: StopResult[];
  /** 当選ライン情報 */
  winLines: PaylineResult<S>[];
  /** 合計配当 */
  totalPayout: number;
  /** リプレイ当選フラグ */
  isReplay: boolean;
  /** 取りこぼしフラグ */
  isMiss: boolean;
  /** 取りこぼした当選役情報 */
  missedRole?: WinningRole;
  /** 内部当選役 */
  winningRole: WinningRole;
}
