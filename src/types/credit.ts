/**
 * BET設定。初期クレジット額、BET額バリエーション、デフォルトBET額を定義する。
 *
 * @example
 * ```ts
 * const config: BetConfig = {
 *   initialCredit: 1000,
 *   betOptions: [1, 2, 3],
 *   defaultBet: 3,
 *   historySize: 50,
 * };
 * ```
 */
export interface BetConfig {
  /** 初期クレジット額 */
  initialCredit: number;
  /** BET額のバリエーション */
  betOptions: number[];
  /** デフォルトのBET額 */
  defaultBet: number;
  /** 変動履歴の保持件数（省略時はデフォルト値を使用） */
  historySize?: number;
  /**
   * BET額ごとの有効Paylineインデックス。
   * 省略時は全Paylineが有効。
   * @example { 1: [1], 2: [0,1,2], 3: [0,1,2,3,4] }
   */
  paylinesPerBet?: Record<number, number[]>;
  /**
   * BET額ごとの抽選制限。指定されたBET額未満では抽選対象外となるWinningRole IDの一覧。
   * @example { 3: ['super_big_bonus'] } — super_big_bonusは3BET時のみ抽選
   */
  exclusiveRolesPerBet?: Record<number, string[]>;
}

/**
 * クレジット変動履歴。クレジット残高の変動1件分の情報を保持する。
 *
 * @example
 * ```ts
 * const history: CreditHistory = {
 *   type: 'BET',
 *   amount: 3,
 *   balanceAfter: 997,
 *   timestamp: 1700000000000,
 * };
 * ```
 */
export interface CreditHistory {
  /** 変動種別 */
  type: 'BET' | 'PAYOUT' | 'DEPOSIT' | 'WITHDRAW';
  /** 変動額 */
  amount: number;
  /** 変動後の残高 */
  balanceAfter: number;
  /** 変動時のタイムスタンプ */
  timestamp: number;
}

/**
 * クレジット状態。現在の残高、BET額、変動履歴を保持する。
 *
 * @example
 * ```ts
 * const state: CreditState = {
 *   balance: 500,
 *   currentBet: 3,
 *   history: [],
 * };
 * ```
 */
export interface CreditState {
  /** 現在のクレジット残高 */
  balance: number;
  /** 現在のBET額 */
  currentBet: number;
  /** 変動履歴 */
  history: CreditHistory[];
}
