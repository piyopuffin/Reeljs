import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from './useNotification';
import type { NotificationConfig, WinningRole } from '../types';

const bonusRole: WinningRole = {
  id: 'bb', name: 'BIG_BONUS', type: 'BONUS', payout: 0, patterns: [], priority: 1,
};

const defaultConfig: NotificationConfig = {
  enabledTypes: { PRE_SPIN: true },
  targetRoleTypes: ['BONUS'],
};

describe('useNotification', () => {
  it('starts with idle status', () => {
    const { result } = renderHook(() => useNotification(defaultConfig));
    expect(result.current.status).toBe('idle');
    expect(result.current.lastPayload).toBeNull();
  });

  it('transitions to notified when notification fires', () => {
    const { result } = renderHook(() => useNotification(defaultConfig));

    act(() => {
      result.current._manager.check('PRE_SPIN', bonusRole);
    });

    expect(result.current.status).toBe('notified');
    expect(result.current.lastPayload).not.toBeNull();
    expect(result.current.lastPayload!.type).toBe('PRE_SPIN');
  });

  it('acknowledgeNotification returns to idle', () => {
    const { result } = renderHook(() => useNotification(defaultConfig));

    act(() => {
      result.current._manager.check('PRE_SPIN', bonusRole);
    });

    act(() => {
      result.current.acknowledgeNotification();
    });

    expect(result.current.status).toBe('idle');
  });

  it('fires per-type callback', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useNotification(defaultConfig));

    act(() => {
      result.current.onPreSpin(cb);
    });

    act(() => {
      result.current._manager.check('PRE_SPIN', bonusRole);
    });

    expect(cb).toHaveBeenCalledTimes(1);
  });
});
