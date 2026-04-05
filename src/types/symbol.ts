/**
 * シンボル定義。リール上に表示される個々のアイコン・絵柄の情報を保持する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const cherry: SymbolDefinition<'cherry' | 'bell'> = {
 *   id: 'cherry',
 *   name: 'チェリー',
 *   weight: 10,
 * };
 * ```
 */
export interface SymbolDefinition<S extends string = string> {
  /** シンボルの一意識別子 */
  id: S;
  /** シンボルの表示名 */
  name: string;
  /** 抽選時の重み付け（大きいほど出現しやすい） */
  weight: number;
}

/**
 * リール設定。各リールのシンボル定義とリールストリップを保持する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const reelConfig: ReelConfig<'cherry' | 'bell' | 'bar'> = {
 *   symbols: [
 *     { id: 'cherry', name: 'チェリー', weight: 10 },
 *     { id: 'bell', name: 'ベル', weight: 5 },
 *     { id: 'bar', name: 'BAR', weight: 2 },
 *   ],
 *   reelStrip: ['cherry', 'bell', 'bar', 'cherry', 'bell'],
 * };
 * ```
 */
export interface ReelConfig<S extends string = string> {
  /** このリールで使用するシンボル定義の配列 */
  symbols: SymbolDefinition<S>[];
  /** リールストリップ（循環リスト） */
  reelStrip: ReelStrip<S>;
}

/**
 * リールストリップ。リール上のシンボル配列を定義する循環リスト。
 * 配列の末尾の次は先頭に戻る。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const strip: ReelStrip = ['cherry', 'bell', 'bar', 'seven', 'replay'];
 * ```
 */
export type ReelStrip<S extends string = string> = S[];
