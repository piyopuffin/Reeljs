import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCredit } from './useCredit';
import type { BetConfig } from '../types';

const defaultConfig: BetConfig = {
  initialCredit: 1000,
  betOptions: [1, 2, 3],
  defaultBet: 1,
};

describe('useCredit', () => {
  it('returns initial balance and bet', () => {
    const { result } = renderHook(() => useCredit(defaultConfig));
    expect(result.current.balance).toBe(1000);
    expect(result.current.currentBet).toBe(1);
    expect(result.current.canSpin).toBe(true);
    expect(result.current.betOptions).toEqual([1, 2, 3]);
  });

  it('setBet changes the current bet', () => {
    const { result } = renderHook(() => useCredit(defaultConfig));
    act(() => {
      result.current.setBet(3);
    });
    expect(result.current.currentBet).toBe(3);
  });

  it('deposit increases balance', () => {
    const { result } = renderHook(() => useCredit(defaultConfig));
    act(() => {
      result.current.deposit(500);
    });
    expect(result.current.balance).toBe(1500);
    expect(result.current.history.length).toBe(1);
  });

  it('withdraw decreases balance', () => {
    const { result } = renderHook(() => useCredit(defaultConfig));
    act(() => {
      result.current.withdraw(200);
    });
    expect(result.current.balance).toBe(800);
  });

  it('canSpin is false when balance < currentBet', () => {
    const { result } = renderHook(() =>
      useCredit({ initialCredit: 0, betOptions: [1], defaultBet: 1 }),
    );
    expect(result.current.canSpin).toBe(false);
  });
});
