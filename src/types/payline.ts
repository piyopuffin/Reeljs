import type { WinningRoleType } from './game-mode';

/**
 * 当選判定ライン。各リールの行位置を指定し、横・斜め・V字等のパターンを定義する。
 *
 * @example
 * ```ts
 * // 中段横一列
 * const centerLine: Payline = { index: 0, positions: [1, 1, 1] };
 * // 斜めライン（左上→右下）
 * const diagonalLine: Payline = { index: 1, positions: [0, 1, 2] };
 * ```
 */
export interface Payline {
  /** ライン番号 */
  index: number;
  /** 各リールの行位置（例: [0,0,0]で上段横一列） */
  positions: number[];
}

/**
 * 配当表。シンボルの組み合わせパターンと配当額の対応を管理する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const payTable: PayTable = {
 *   entries: [
 *     { pattern: ['cherry', 'cherry', 'cherry'], payout: 10, roleType: 'SMALL_WIN' },
 *     { pattern: ['seven', 'seven', 'seven'], payout: 0, roleType: 'BONUS' },
 *   ],
 * };
 * ```
 */
export interface PayTable<S extends string = string> {
  /** 配当表エントリの配列 */
  entries: PayTableEntry<S>[];
}

/**
 * 配当表エントリ。1つのシンボル組み合わせパターンと配当額を定義する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const entry: PayTableEntry = {
 *   pattern: ['bell', 'bell', 'bell'],
 *   payout: 8,
 *   roleType: 'SMALL_WIN',
 * };
 * ```
 */
export interface PayTableEntry<S extends string = string> {
  /** シンボルの組み合わせパターン */
  pattern: S[];
  /** 配当額 */
  payout: number;
  /** 当選役種別 */
  roleType: WinningRoleType;
}
