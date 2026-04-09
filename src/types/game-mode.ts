/**
 * ゲームモード列挙型。スロットゲームの現在のモード状態を表す。
 *
 * - `Normal` — 通常モード（デフォルト）
 * - `Chance` — チャンスモード（BT突入のチャンス）
 * - `Bonus` — ボーナスモード（高配当期間）
 * - `BT` — ボーナストリガーモード（SUPER_BIG_BONUS再突入のチャンス）
 *
 * @example
 * ```ts
 * const mode: GameMode = 'Normal';
 * ```
 */
export type GameMode = 'Normal' | 'Chance' | 'Bonus' | 'BT';

/**
 * ボーナス種別。ボーナスモード中のボーナスタイプを表す。
 *
 * - `SUPER_BIG_BONUS` — 最上位ボーナス。終了後はBTモードへ移行
 * - `BIG_BONUS` — 上位ボーナス。終了後は通常モードへ移行
 * - `REG_BONUS` — 通常ボーナス。終了後は通常モードへ移行
 *
 * @example
 * ```ts
 * const bonus: BonusType = 'SUPER_BIG_BONUS';
 * ```
 */
export type BonusType = 'SUPER_BIG_BONUS' | 'BIG_BONUS' | 'REG_BONUS';

/**
 * 当選役種別。内部抽選で決定される当選役のカテゴリを表す。
 *
 * - `BONUS` — ボーナス当選
 * - `SMALL_WIN` — 小役当選（チェリー、スイカ、ベル等）
 * - `REPLAY` — リプレイ（再遊技）
 * - `MISS` — ハズレ
 *
 * @example
 * ```ts
 * const roleType: WinningRoleType = 'SMALL_WIN';
 * ```
 */
export type WinningRoleType = 'BONUS' | 'SMALL_WIN' | 'REPLAY' | 'MISS';

/**
 * 当選役。内部抽選で決定される当選役の詳細情報を保持する。
 *
 * @example
 * ```ts
 * const role: WinningRole = {
 *   id: 'cherry',
 *   name: 'チェリー',
 *   type: 'SMALL_WIN',
 *   payout: 2,
 *   patterns: [['cherry', 'ANY', 'ANY']],
 *   priority: 10,
 * };
 * ```
 */
export interface WinningRole {
  /** 当選役の一意識別子 */
  id: string;
  /** 当選役の表示名 */
  name: string;
  /** 当選役種別 */
  type: WinningRoleType;
  /** ボーナス種別（BONUS当選時のみ） */
  bonusType?: BonusType;
  /** 配当額 */
  payout: number;
  /** 成立シンボル組み合わせパターン */
  patterns: string[][];
  /** 優先順位（大きいほど優先） */
  priority: number;
}

/**
 * 小役定義。各小役のID、名前、種別、配当、出目パターン、優先順位を定義する。
 * InternalLotteryに登録して使用する。
 *
 * @example
 * ```ts
 * const bellDef: WinningRoleDefinition = {
 *   id: 'bell',
 *   name: 'ベル',
 *   type: 'SMALL_WIN',
 *   payout: 8,
 *   patterns: [['bell', 'bell', 'bell']],
 *   priority: 30,
 * };
 * ```
 */
export interface WinningRoleDefinition {
  /** 小役の一意識別子 */
  id: string;
  /** 小役の表示名 */
  name: string;
  /** 当選役種別 */
  type: WinningRoleType;
  /** 配当額 */
  payout: number;
  /** 成立シンボル組み合わせパターン */
  patterns: string[][];
  /** 優先順位（大きいほど優先） */
  priority: number;
  /** ボーナス種別（BONUS型の当選役で使用。省略時はBONUS_ID_TO_TYPEフォールバック） */
  bonusType?: BonusType;
}

/**
 * 持ち越しフラグ。取りこぼし発生時にボーナス当選状態を次ゲーム以降に持ち越すための情報。
 *
 * @example
 * ```ts
 * const flag: CarryOverFlag = {
 *   winningRole: { id: 'big_bonus', name: 'BIG BONUS', type: 'BONUS', payout: 0, patterns: [], priority: 90 },
 *   gameCount: 3,
 * };
 * ```
 */
export interface CarryOverFlag {
  /** 持ち越し中の当選役 */
  winningRole: WinningRole;
  /** 持ち越し開始からのゲーム数 */
  gameCount: number;
}

/**
 * モード遷移確率設定。各モード間の遷移確率を定義する。
 * ボーナス当選確率はInternalLotteryで管理するため、ここには含めない。
 *
 * @example
 * ```ts
 * const config: ModeTransitionConfig = {
 *   normalToChance: 0.02,
 *   chanceTobt: 0.3,
 *   btToSuperBigBonus: 0.1,
 * };
 * ```
 */
export interface ModeTransitionConfig {
  /** NormalMode → ChanceMode の遷移確率（0〜1） */
  normalToChance: number;
  /** ChanceMode → BTMode の遷移確率（0〜1） */
  chanceTobt: number;
  /** BTMode → SUPER_BIG_BONUS の再突入確率（0〜1） */
  btToSuperBigBonus: number;
}

/**
 * ボーナス設定。各BonusTypeの配当倍率・継続スピン数・最大獲得枚数を定義する。
 *
 * @example
 * ```ts
 * const config: BonusConfig = {
 *   type: 'BIG_BONUS',
 *   payoutMultiplier: 2,
 *   maxSpins: 30,
 *   maxPayout: 300,
 * };
 * ```
 */
export interface BonusConfig {
  /** ボーナス種別 */
  type: BonusType;
  /** 配当倍率 */
  payoutMultiplier: number;
  /** 継続スピン数 */
  maxSpins: number;
  /** 最大獲得枚数（MaxPayout） */
  maxPayout: number;
}

/**
 * BTモード設定。継続スピン数上限、最大獲得枚数、WinPatternを定義する。
 *
 * @example
 * ```ts
 * const btConfig: BTConfig = {
 *   maxSpins: 50,
 *   maxPayout: 500,
 *   winPatterns: [{ symbols: ['seven', 'seven', 'seven'] }],
 * };
 * ```
 */
export interface BTConfig {
  /** 継続スピン数上限 */
  maxSpins: number;
  /** 最大獲得枚数（MaxPayout） */
  maxPayout: number;
  /** SUPER_BIG_BONUS再突入のトリガーパターン */
  winPatterns: WinPattern[];
}

/**
 * チャンスモード設定。継続スピン数上限、最大獲得枚数、WinPatternを定義する。
 *
 * @example
 * ```ts
 * const chanceConfig: ChanceConfig = {
 *   maxSpins: 20,
 *   maxPayout: 200,
 *   winPatterns: [{ symbols: ['star', 'star', 'star'] }],
 * };
 * ```
 */
export interface ChanceConfig {
  /** 継続スピン数上限 */
  maxSpins: number;
  /** 最大獲得枚数（MaxPayout） */
  maxPayout: number;
  /** BTモード突入のトリガーパターン */
  winPatterns: WinPattern[];
}

/**
 * モード遷移トリガーパターン。特定のシンボル組み合わせが揃った場合にモード遷移を発生させる。
 *
 * @example
 * ```ts
 * // 位置指定なし（いずれかの行でマッチ）
 * const pattern1: WinPattern = { symbols: ['seven', 'seven', 'seven'] };
 * // 位置指定あり（特定の行位置でマッチ）
 * const pattern2: WinPattern = { symbols: ['star', 'star', 'star'], positions: [0, 0, 0] };
 * ```
 */
export interface WinPattern {
  /** トリガーとなるシンボルの配列 */
  symbols: string[];
  /** 各リールの行位置（省略時はいずれかの行でマッチ） */
  positions?: number[];
}
