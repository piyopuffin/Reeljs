import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditManager } from './credit-manager';
import type { BetConfig } from '../types';

const defaultConfig: BetConfig = {
  initialCredit: 1000,
  betOptions: [1, 2, 3],
  defaultBet: 1,
};

describe('CreditManager', () => {
  let cm: CreditManager;

  beforeEach(() => {
    cm = new CreditManager(defaultConfig);
  });

  // --- Construction & Validation ---

  describe('constructor validation', () => {
    it('should initialize with correct balance and bet', () => {
      expect(cm.balance).toBe(1000);
      expect(cm.currentBet).toBe(1);
    });

    it('should throw on negative initial credit', () => {
      expect(() => new CreditManager({ ...defaultConfig, initialCredit: -1 }))
        .toThrow('Initial credit must not be negative');
    });

    it('should throw on empty betOptions', () => {
      expect(() => new CreditManager({ ...defaultConfig, betOptions: [] }))
        .toThrow('betOptions must not be empty');
    });

    it('should throw on betOptions containing 0', () => {
      expect(() => new CreditManager({ ...defaultConfig, betOptions: [0, 1] }))
        .toThrow('All bet options must be greater than 0');
    });

    it('should throw on betOptions containing negative value', () => {
      expect(() => new CreditManager({ ...defaultConfig, betOptions: [-1, 1] }))
        .toThrow('All bet options must be greater than 0');
    });

    it('should throw when defaultBet is not in betOptions', () => {
      expect(() => new CreditManager({ ...defaultConfig, defaultBet: 5 }))
        .toThrow('defaultBet 5 is not included in betOptions');
    });

    it('should allow zero initial credit', () => {
      const cm2 = new CreditManager({ ...defaultConfig, initialCredit: 0 });
      expect(cm2.balance).toBe(0);
    });
  });

  // --- bet() ---

  describe('bet()', () => {
    it('should deduct currentBet from balance and return true', () => {
      const result = cm.bet();
      expect(result).toBe(true);
      expect(cm.balance).toBe(999);
    });

    it('should return false when balance is insufficient', () => {
      const cm2 = new CreditManager({ ...defaultConfig, initialCredit: 0 });
      const result = cm2.bet();
      expect(result).toBe(false);
      expect(cm2.balance).toBe(0);
    });

    it('should return false when balance equals bet minus 1', () => {
      const cm2 = new CreditManager({
        initialCredit: 2,
        betOptions: [3],
        defaultBet: 3,
      });
      expect(cm2.bet()).toBe(false);
      expect(cm2.balance).toBe(2);
    });

    it('should succeed when balance exactly equals bet', () => {
      const cm2 = new CreditManager({
        initialCredit: 3,
        betOptions: [3],
        defaultBet: 3,
      });
      expect(cm2.bet()).toBe(true);
      expect(cm2.balance).toBe(0);
    });

    it('should record BET history entry', () => {
      cm.bet();
      const history = cm.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('BET');
      expect(history[0].amount).toBe(1);
      expect(history[0].balanceAfter).toBe(999);
    });
  });

  // --- payout() ---

  describe('payout()', () => {
    it('should add amount to balance', () => {
      cm.payout(50);
      expect(cm.balance).toBe(1050);
    });

    it('should throw on negative amount', () => {
      expect(() => cm.payout(-1)).toThrow('Payout amount must not be negative');
    });

    it('should record PAYOUT history entry', () => {
      cm.payout(100);
      const history = cm.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('PAYOUT');
      expect(history[0].amount).toBe(100);
      expect(history[0].balanceAfter).toBe(1100);
    });
  });

  // --- deposit() ---

  describe('deposit()', () => {
    it('should add amount to balance', () => {
      cm.deposit(500);
      expect(cm.balance).toBe(1500);
    });

    it('should throw on negative amount', () => {
      expect(() => cm.deposit(-10)).toThrow('Deposit amount must not be negative');
    });

    it('should record DEPOSIT history entry', () => {
      cm.deposit(200);
      const history = cm.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('DEPOSIT');
      expect(history[0].amount).toBe(200);
      expect(history[0].balanceAfter).toBe(1200);
    });
  });

  // --- withdraw() ---

  describe('withdraw()', () => {
    it('should deduct amount and return true', () => {
      expect(cm.withdraw(100)).toBe(true);
      expect(cm.balance).toBe(900);
    });

    it('should return false when amount exceeds balance', () => {
      expect(cm.withdraw(1001)).toBe(false);
      expect(cm.balance).toBe(1000);
    });

    it('should succeed when amount equals balance', () => {
      expect(cm.withdraw(1000)).toBe(true);
      expect(cm.balance).toBe(0);
    });

    it('should throw on negative amount', () => {
      expect(() => cm.withdraw(-5)).toThrow('Withdraw amount must not be negative');
    });

    it('should record WITHDRAW history entry', () => {
      cm.withdraw(300);
      const history = cm.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('WITHDRAW');
      expect(history[0].amount).toBe(300);
      expect(history[0].balanceAfter).toBe(700);
    });
  });

  // --- setBet() ---

  describe('setBet()', () => {
    it('should change current bet to a valid option', () => {
      cm.setBet(3);
      expect(cm.currentBet).toBe(3);
    });

    it('should throw when amount is not in betOptions', () => {
      expect(() => cm.setBet(5)).toThrow('Invalid bet amount 5');
    });

    it('should allow changing bet multiple times', () => {
      cm.setBet(2);
      expect(cm.currentBet).toBe(2);
      cm.setBet(3);
      expect(cm.currentBet).toBe(3);
      cm.setBet(1);
      expect(cm.currentBet).toBe(1);
    });
  });

  // --- getHistory() ---

  describe('getHistory()', () => {
    it('should return empty array initially', () => {
      expect(cm.getHistory()).toEqual([]);
    });

    it('should return all entries when count is omitted', () => {
      cm.bet();
      cm.payout(10);
      cm.deposit(5);
      expect(cm.getHistory()).toHaveLength(3);
    });

    it('should return last N entries when count is specified', () => {
      cm.bet();
      cm.payout(10);
      cm.deposit(5);
      const last2 = cm.getHistory(2);
      expect(last2).toHaveLength(2);
      expect(last2[0].type).toBe('PAYOUT');
      expect(last2[1].type).toBe('DEPOSIT');
    });

    it('should limit history to historySize', () => {
      const smallHistory = new CreditManager({
        ...defaultConfig,
        initialCredit: 10000,
        historySize: 3,
      });
      smallHistory.bet();
      smallHistory.bet();
      smallHistory.bet();
      smallHistory.bet(); // 4th entry, should evict the 1st
      expect(smallHistory.getHistory()).toHaveLength(3);
    });

    it('should include timestamp in history entries', () => {
      const before = Date.now();
      cm.bet();
      const after = Date.now();
      const entry = cm.getHistory()[0];
      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(after);
    });
  });

  // --- getState() ---

  describe('getState()', () => {
    it('should return current credit state', () => {
      cm.bet();
      cm.payout(50);
      const state = cm.getState();
      expect(state.balance).toBe(1049);
      expect(state.currentBet).toBe(1);
      expect(state.history).toHaveLength(2);
    });

    it('should return a copy of history (not a reference)', () => {
      cm.bet();
      const state = cm.getState();
      state.history.push({
        type: 'DEPOSIT',
        amount: 999,
        balanceAfter: 999,
        timestamp: 0,
      });
      expect(cm.getHistory()).toHaveLength(1);
    });
  });

  // --- Integration: combined operations ---

  describe('combined operations', () => {
    it('should track balance correctly through multiple operations', () => {
      // Start: 1000, bet=1
      cm.bet();          // 999
      cm.payout(10);     // 1009
      cm.setBet(3);
      cm.bet();          // 1006
      cm.deposit(100);   // 1106
      cm.withdraw(6);    // 1100
      expect(cm.balance).toBe(1100);
      expect(cm.getHistory()).toHaveLength(5);
    });

    it('should not modify balance on failed bet', () => {
      const cm2 = new CreditManager({
        initialCredit: 1,
        betOptions: [2],
        defaultBet: 2,
      });
      cm2.bet(); // fails
      expect(cm2.balance).toBe(1);
      expect(cm2.getHistory()).toHaveLength(0);
    });

    it('should not modify balance on failed withdraw', () => {
      cm.withdraw(2000); // fails
      expect(cm.balance).toBe(1000);
      expect(cm.getHistory()).toHaveLength(0);
    });
  });
});
