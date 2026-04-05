import { describe, it, expect, vi } from 'vitest';
import { NotificationManager } from './notification-manager';
import type { NotificationConfig, NotificationPayload } from '../types/notification';
import type { WinningRole, WinningRoleType } from '../types/game-mode';
import type { SpinResult } from '../types/spin';

/** テスト用ターゲットロールタイプ */
const TARGET_BONUS: WinningRoleType[] = ['BONUS'];
const TARGET_BONUS_SMALL: WinningRoleType[] = ['BONUS', 'SMALL_WIN'];

/** テスト用 WinningRole ヘルパー */
function makeWinningRole(
  overrides: Partial<WinningRole> = {}
): WinningRole {
  return {
    id: 'bonus-1',
    name: 'Big Bonus',
    type: 'BONUS',
    payout: 300,
    patterns: [['7', '7', '7']],
    priority: 1,
    ...overrides,
  };
}

/** テスト用 SpinResult ヘルパー */
function makeSpinResult(overrides: Partial<SpinResult> = {}): SpinResult {
  const role = makeWinningRole();
  return {
    grid: [['7', '7', '7']],
    stopResults: [],
    winLines: [],
    totalPayout: 300,
    isReplay: false,
    isMiss: false,
    winningRole: role,
    ...overrides,
  };
}

describe('NotificationManager', () => {
  describe('constructor validation', () => {
    it('should throw on invalid NotificationType in enabledTypes', () => {
      const config = {
        enabledTypes: { INVALID_TYPE: true } as any,
        targetRoleTypes: TARGET_BONUS,
      };
      expect(() => new NotificationManager(config)).toThrow(
        'Invalid NotificationType in enabledTypes: INVALID_TYPE'
      );
    });

    it('should throw when onNotification is not a function', () => {
      const config: any = {
        enabledTypes: {},
        targetRoleTypes: TARGET_BONUS,
        onNotification: 'not-a-function',
      };
      expect(() => new NotificationManager(config)).toThrow(
        'onNotification must be a function'
      );
    });

    it('should accept valid config without errors', () => {
      const config: NotificationConfig = {
        enabledTypes: { PRE_SPIN: true, POST_SPIN: false },
        targetRoleTypes: TARGET_BONUS,
        onNotification: vi.fn(),
      };
      expect(() => new NotificationManager(config)).not.toThrow();
    });

    it('should accept config with no onNotification callback', () => {
      const config: NotificationConfig = {
        enabledTypes: { PRE_SPIN: true },
        targetRoleTypes: TARGET_BONUS,
      };
      expect(() => new NotificationManager(config)).not.toThrow();
    });
  });

  describe('check() - PRE_SPIN', () => {
    it('should fire notification for target role type when PRE_SPIN is enabled', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { PRE_SPIN: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });
      const role = makeWinningRole({ type: 'BONUS' });

      nm.check('PRE_SPIN', role);

      expect(callback).toHaveBeenCalledOnce();
      const payload: NotificationPayload = callback.mock.calls[0][0];
      expect(payload.type).toBe('PRE_SPIN');
      expect(payload.winningRole).toBe(role);
      expect(payload.timestamp).toBeGreaterThan(0);
    });

    it('should not fire when PRE_SPIN is disabled', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { PRE_SPIN: false },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.check('PRE_SPIN', makeWinningRole({ type: 'BONUS' }));
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not fire when role type is not a target', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { PRE_SPIN: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.check('PRE_SPIN', makeWinningRole({ type: 'SMALL_WIN' }));
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not fire when winningRole is undefined', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { PRE_SPIN: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.check('PRE_SPIN');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('check() - POST_SPIN', () => {
    it('should fire notification with spinResult when POST_SPIN is enabled', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { POST_SPIN: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });
      const role = makeWinningRole({ type: 'BONUS' });
      const result = makeSpinResult();

      nm.check('POST_SPIN', role, result);

      expect(callback).toHaveBeenCalledOnce();
      const payload: NotificationPayload = callback.mock.calls[0][0];
      expect(payload.type).toBe('POST_SPIN');
      expect(payload.winningRole).toBe(role);
      expect(payload.spinResult).toBe(result);
    });

    it('should not fire when POST_SPIN is disabled', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { POST_SPIN: false },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.check('POST_SPIN', makeWinningRole(), makeSpinResult());
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('check() - LEVER_ON', () => {
    it('should fire notification for target role when LEVER_ON is enabled', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { LEVER_ON: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });
      const role = makeWinningRole({ type: 'BONUS' });

      nm.check('LEVER_ON', role);

      expect(callback).toHaveBeenCalledOnce();
      const payload: NotificationPayload = callback.mock.calls[0][0];
      expect(payload.type).toBe('LEVER_ON');
      expect(payload.winningRole).toBe(role);
    });
  });

  describe('check() - NEXT_BET', () => {
    it('should fire notification using previous win info', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { NEXT_BET: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });
      const prevRole = makeWinningRole({ type: 'BONUS' });

      nm.setPreviousWin(prevRole);
      nm.check('NEXT_BET');

      expect(callback).toHaveBeenCalledOnce();
      const payload: NotificationPayload = callback.mock.calls[0][0];
      expect(payload.type).toBe('NEXT_BET');
      expect(payload.winningRole).toBe(prevRole);
    });

    it('should clear previous win after NEXT_BET fires', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { NEXT_BET: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.setPreviousWin(makeWinningRole({ type: 'BONUS' }));
      nm.check('NEXT_BET');
      expect(callback).toHaveBeenCalledOnce();

      // Second call should not fire — previous win was cleared
      callback.mockClear();
      nm.check('NEXT_BET');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not fire when no previous win is set', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { NEXT_BET: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.check('NEXT_BET');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not fire when previous win role type is not a target', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { NEXT_BET: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.setPreviousWin(makeWinningRole({ type: 'SMALL_WIN' }));
      nm.check('NEXT_BET');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear previous win even when role type is not a target', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { NEXT_BET: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.setPreviousWin(makeWinningRole({ type: 'SMALL_WIN' }));
      nm.check('NEXT_BET');

      // Set a BONUS role now — should fire since previous non-target was cleared
      nm.setPreviousWin(makeWinningRole({ type: 'BONUS' }));
      nm.check('NEXT_BET');
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('setPreviousWin / clearPreviousWin', () => {
    it('should retain previous win for NEXT_BET', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { NEXT_BET: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.setPreviousWin(makeWinningRole({ type: 'BONUS' }));
      nm.check('NEXT_BET');
      expect(callback).toHaveBeenCalledOnce();
    });

    it('clearPreviousWin should prevent NEXT_BET from firing', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { NEXT_BET: true },
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.setPreviousWin(makeWinningRole({ type: 'BONUS' }));
      nm.clearPreviousWin();
      nm.check('NEXT_BET');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('check() - invalid timing', () => {
    it('should throw on invalid NotificationType', () => {
      const nm = new NotificationManager({
        enabledTypes: {},
        targetRoleTypes: TARGET_BONUS,
      });

      expect(() => nm.check('INVALID' as any)).toThrow(
        'Invalid NotificationType: INVALID'
      );
    });
  });

  describe('multiple target role types', () => {
    it('should fire for any configured target role type', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: { PRE_SPIN: true },
        targetRoleTypes: TARGET_BONUS_SMALL,
        onNotification: callback,
      });

      nm.check('PRE_SPIN', makeWinningRole({ type: 'BONUS' }));
      nm.check('PRE_SPIN', makeWinningRole({ type: 'SMALL_WIN' }));
      nm.check('PRE_SPIN', makeWinningRole({ type: 'REPLAY' }));

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('no callback configured', () => {
    it('should not throw when no onNotification callback is set', () => {
      const nm = new NotificationManager({
        enabledTypes: { PRE_SPIN: true },
        targetRoleTypes: TARGET_BONUS,
      });

      expect(() =>
        nm.check('PRE_SPIN', makeWinningRole({ type: 'BONUS' }))
      ).not.toThrow();
    });
  });

  describe('default disabled types', () => {
    it('should treat unspecified types as disabled', () => {
      const callback = vi.fn();
      const nm = new NotificationManager({
        enabledTypes: {},
        targetRoleTypes: TARGET_BONUS,
        onNotification: callback,
      });

      nm.check('PRE_SPIN', makeWinningRole({ type: 'BONUS' }));
      nm.check('POST_SPIN', makeWinningRole({ type: 'BONUS' }));
      nm.check('LEVER_ON', makeWinningRole({ type: 'BONUS' }));
      nm.setPreviousWin(makeWinningRole({ type: 'BONUS' }));
      nm.check('NEXT_BET');

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
