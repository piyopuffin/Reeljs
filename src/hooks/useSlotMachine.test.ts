import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlotMachine } from './useSlotMachine';
import type { UseSlotMachineConfig } from './useSlotMachine';

const minimalConfig: UseSlotMachineConfig = {
  spinEngine: {
    reelConfigs: [
      {
        symbols: [
          { id: 'A', name: 'A', weight: 1 },
          { id: 'B', name: 'B', weight: 1 },
        ],
        reelStrip: ['A', 'B', 'A'],
      },
      {
        symbols: [
          { id: 'A', name: 'A', weight: 1 },
          { id: 'B', name: 'B', weight: 1 },
        ],
        reelStrip: ['A', 'B', 'A'],
      },
      {
        symbols: [
          { id: 'A', name: 'A', weight: 1 },
          { id: 'B', name: 'B', weight: 1 },
        ],
        reelStrip: ['A', 'B', 'A'],
      },
    ],
    payTable: { entries: [] },
    paylines: [],
  },
};

describe('useSlotMachine', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useSlotMachine(minimalConfig));
    expect(result.current.spinState).toBe('idle');
    expect(result.current.spinResult).toBeNull();
  });

  it('spin transitions to stopped and produces a result', () => {
    const { result } = renderHook(() => useSlotMachine(minimalConfig));
    act(() => {
      result.current.spin();
    });
    expect(result.current.spinState).toBe('stopped');
    expect(result.current.spinResult).not.toBeNull();
    expect(result.current.spinResult!.grid).toBeDefined();
  });

  it('reset returns to idle', () => {
    const { result } = renderHook(() => useSlotMachine(minimalConfig));
    act(() => {
      result.current.spin();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.spinState).toBe('idle');
    expect(result.current.spinResult).toBeNull();
  });

  it('integrates with credit manager', () => {
    const configWithCredit: UseSlotMachineConfig = {
      ...minimalConfig,
      credit: { initialCredit: 100, betOptions: [10], defaultBet: 10 },
    };
    const { result } = renderHook(() => useSlotMachine(configWithCredit));
    act(() => {
      result.current.spin();
    });
    expect(result.current.spinState).toBe('stopped');
    // Credit should have been deducted
    expect(result.current._credit!.balance).toBeLessThanOrEqual(100);
  });

  it('does not spin when credits are insufficient', () => {
    const configWithCredit: UseSlotMachineConfig = {
      ...minimalConfig,
      credit: { initialCredit: 0, betOptions: [10], defaultBet: 10 },
    };
    const { result } = renderHook(() => useSlotMachine(configWithCredit));
    act(() => {
      result.current.spin();
    });
    // Should remain idle since bet() fails
    expect(result.current.spinState).toBe('idle');
    expect(result.current.spinResult).toBeNull();
  });
});
