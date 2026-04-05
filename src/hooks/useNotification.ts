import { useState, useCallback, useRef } from 'react';
import type { NotificationConfig, NotificationPayload, NotificationType } from '../types';
import { NotificationManager } from '../game/notification-manager';

type NotificationStatus = 'pending' | 'notified' | 'idle';

/**
 * NotificationManager をラップし、告知状態のリアクティブ管理を提供するフック。
 * 告知状態（pending/notified/idle）、直近のペイロード、各タイミングの個別コールバック登録を提供する。
 *
 * @param config - 告知設定（有効タイミング、対象当選役種別等）
 * @returns 告知状態とアクション関数
 *
 * @example
 * ```tsx
 * function NotificationPanel() {
 *   const { status, lastPayload, acknowledgeNotification, onPreSpin } = useNotification({
 *     enabledTypes: { PRE_SPIN: true },
 *     targetRoleTypes: ['BONUS'],
 *   });
 *   onPreSpin((payload) => console.log('先告知:', payload.winningRole.name));
 *   return <p>告知状態: {status}</p>;
 * }
 * ```
 */
export function useNotification(config: NotificationConfig) {
  const callbacksRef = useRef<Partial<Record<NotificationType, (payload: NotificationPayload) => void>>>({});
  const queueRef = useRef<NotificationPayload[]>([]);

  const [status, setStatus] = useState<NotificationStatus>('idle');
  const [lastPayload, setLastPayload] = useState<NotificationPayload | null>(null);

  // Build the manager with an internal onNotification that drives state
  const managerRef = useRef<NotificationManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new NotificationManager({
      ...config,
      onNotification: (payload: NotificationPayload) => {
        // If already notified (pending acknowledgement), queue it
        setStatus((prev) => {
          if (prev === 'notified') {
            queueRef.current.push(payload);
            return 'notified';
          }
          return 'notified';
        });
        setLastPayload(payload);

        // Fire per-type callback
        const cb = callbacksRef.current[payload.type];
        if (cb) cb(payload);

        // Also fire user-provided onNotification
        config.onNotification?.(payload);
      },
    });
  }
  const manager = managerRef.current;

  const acknowledgeNotification = useCallback(() => {
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      setLastPayload(next);
      setStatus('notified');
    } else {
      setStatus('idle');
      setLastPayload(null);
    }
  }, []);

  const onPreSpin = useCallback((cb: (payload: NotificationPayload) => void) => {
    callbacksRef.current['PRE_SPIN'] = cb;
  }, []);

  const onPostSpin = useCallback((cb: (payload: NotificationPayload) => void) => {
    callbacksRef.current['POST_SPIN'] = cb;
  }, []);

  const onNextBet = useCallback((cb: (payload: NotificationPayload) => void) => {
    callbacksRef.current['NEXT_BET'] = cb;
  }, []);

  const onLeverOn = useCallback((cb: (payload: NotificationPayload) => void) => {
    callbacksRef.current['LEVER_ON'] = cb;
  }, []);

  return {
    status,
    lastPayload,
    acknowledgeNotification,
    onPreSpin,
    onPostSpin,
    onNextBet,
    onLeverOn,
    _manager: manager,
  };
}
