import type { BetConfig, CreditHistory, CreditState } from '../types';

/** デフォルトの履歴保持件数 */
const DEFAULT_HISTORY_SIZE = 100;

/**
 * クレジット残高管理モジュール。BET消費・Payout加算・投入/引き出し操作を一元管理し、
 * 残高不足時のスピン拒否やBET額バリエーションの設定を行う。
 *
 * @example
 * ```ts
 * const manager = new CreditManager({
 *   initialCredit: 1000,
 *   betOptions: [1, 2, 3],
 *   defaultBet: 3,
 * });
 * manager.bet();       // BET消費
 * manager.payout(10);  // 配当加算
 * console.log(manager.balance); // 1007
 * ```
 */
export class CreditManager {
  private _balance: number;
  private _currentBet: number;
  private readonly betOptions: number[];
  private readonly historySize: number;
  private readonly _history: CreditHistory[] = [];

  constructor(config: BetConfig) {
    this.validateConfig(config);

    this._balance = config.initialCredit;
    this._currentBet = config.defaultBet;
    this.betOptions = [...config.betOptions];
    this.historySize = config.historySize ?? DEFAULT_HISTORY_SIZE;

    if (!this.betOptions.includes(config.defaultBet)) {
      throw new Error(
        `defaultBet ${config.defaultBet} is not included in betOptions [${config.betOptions.join(', ')}]`
      );
    }
  }

  /** 現在の残高 */
  get balance(): number {
    return this._balance;
  }

  /** 現在のBET額 */
  get currentBet(): number {
    return this._currentBet;
  }

  /**
   * BET消費: 現在のBET額をクレジット残高から減算する
   * @returns BET成功時 true、クレジット不足時 false
   */
  bet(): boolean {
    if (this._balance < this._currentBet) {
      return false;
    }
    this._balance -= this._currentBet;
    this.addHistory('BET', this._currentBet);
    return true;
  }

  /**
   * Payout加算: 配当額をクレジット残高に加算する
   * @param amount 配当額
   */
  payout(amount: number): void {
    if (amount < 0) {
      throw new Error(`Payout amount must not be negative: ${amount}`);
    }
    this._balance += amount;
    this.addHistory('PAYOUT', amount);
  }

  /**
   * クレジット投入: クレジットを追加する
   * @param amount 投入額
   */
  deposit(amount: number): void {
    if (amount < 0) {
      throw new Error(`Deposit amount must not be negative: ${amount}`);
    }
    this._balance += amount;
    this.addHistory('DEPOSIT', amount);
  }

  /**
   * クレジット引き出し: クレジットを引き出す
   * @param amount 引き出し額
   * @returns 引き出し成功時 true、残高不足時 false
   */
  withdraw(amount: number): boolean {
    if (amount < 0) {
      throw new Error(`Withdraw amount must not be negative: ${amount}`);
    }
    if (amount > this._balance) {
      return false;
    }
    this._balance -= amount;
    this.addHistory('WITHDRAW', amount);
    return true;
  }

  /**
   * BET額変更
   * @param amount 新しいBET額（betOptionsに含まれている必要がある）
   */
  setBet(amount: number): void {
    if (!this.betOptions.includes(amount)) {
      throw new Error(
        `Invalid bet amount ${amount}. Valid options: [${this.betOptions.join(', ')}]`
      );
    }
    this._currentBet = amount;
  }

  /**
   * 変動履歴取得
   * @param count 取得件数（省略時は全件）
   * @returns 直近の変動履歴（新しい順）
   */
  getHistory(count?: number): CreditHistory[] {
    if (count === undefined) {
      return [...this._history];
    }
    return this._history.slice(-count);
  }

  /**
   * 現在のクレジット状態を取得
   */
  getState(): CreditState {
    return {
      balance: this._balance,
      currentBet: this._currentBet,
      history: [...this._history],
    };
  }

  /**
   * 履歴エントリを追加（直近N件を保持）
   */
  private addHistory(type: CreditHistory['type'], amount: number): void {
    const entry: CreditHistory = {
      type,
      amount,
      balanceAfter: this._balance,
      timestamp: Date.now(),
    };
    this._history.push(entry);
    if (this._history.length > this.historySize) {
      this._history.splice(0, this._history.length - this.historySize);
    }
  }

  /**
   * BetConfig のバリデーション
   */
  private validateConfig(config: BetConfig): void {
    if (config.initialCredit < 0) {
      throw new Error(
        `Initial credit must not be negative: ${config.initialCredit}`
      );
    }

    if (!config.betOptions || config.betOptions.length === 0) {
      throw new Error('betOptions must not be empty');
    }

    for (const opt of config.betOptions) {
      if (opt <= 0) {
        throw new Error(
          `All bet options must be greater than 0. Invalid value: ${opt}`
        );
      }
    }
  }
}
