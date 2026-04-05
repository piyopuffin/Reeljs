import { useState, useCallback, useRef } from 'react';
import type { BetConfig, CreditHistory } from '../types';
import { CreditManager } from '../game/credit-manager';

/**
 * CreditManager をラップし、クレジット管理のリアクティブ状態を提供するフック。
 * 残高、BET額、変動履歴をリアクティブに返却し、setBet/deposit/withdrawアクションを提供する。
 *
 * @param config - BET設定（初期クレジット額、BET額バリエーション等）
 * @returns クレジット状態とアクション関数
 *
 * @example
 * ```tsx
 * function CreditPanel() {
 *   const { balance, currentBet, canSpin, setBet, deposit } = useCredit({
 *     initialCredit: 1000,
 *     betOptions: [1, 2, 3],
 *     defaultBet: 3,
 *   });
 *   return (
 *     <div>
 *       <p>残高: {balance} / BET: {currentBet}</p>
 *       <button disabled={!canSpin}>Spin</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCredit(config: BetConfig) {
  const managerRef = useRef<CreditManager>(new CreditManager(config));
  const manager = managerRef.current;

  const [balance, setBalance] = useState(manager.balance);
  const [currentBet, setCurrentBet] = useState(manager.currentBet);
  const [history, setHistory] = useState<CreditHistory[]>([]);

  const sync = useCallback(() => {
    setBalance(manager.balance);
    setCurrentBet(manager.currentBet);
    setHistory(manager.getHistory());
  }, [manager]);

  const setBet = useCallback(
    (amount: number) => {
      manager.setBet(amount);
      sync();
    },
    [manager, sync],
  );

  const deposit = useCallback(
    (amount: number) => {
      manager.deposit(amount);
      sync();
    },
    [manager, sync],
  );

  const withdraw = useCallback(
    (amount: number) => {
      manager.withdraw(amount);
      sync();
    },
    [manager, sync],
  );

  const canSpin = balance >= currentBet;

  return {
    balance,
    currentBet,
    betOptions: config.betOptions,
    canSpin,
    history,
    setBet,
    deposit,
    withdraw,
    /** Expose manager for integration with other hooks */
    _manager: manager,
    /** Sync state after external manager mutations */
    _sync: sync,
  };
}
