import { useCallback, useEffect, useRef } from 'react';
import type { EventEmitter } from '../infrastructure/event-emitter';

/**
 * EventEmitter のイベント購読・発火を React コンポーネント内で管理するフック。
 * コンポーネントアンマウント時に自動購読解除を行う。
 *
 * @param emitter - イベントバスインスタンス
 * @returns emit関数とon関数を含むオブジェクト
 *
 * @example
 * ```tsx
 * const emitter = new EventEmitter();
 * function MyComponent() {
 *   const { emit, on } = useEvent(emitter);
 *   on<number>('win', (payout) => console.log('Win:', payout));
 *   return <button onClick={() => emit('spinStart')}>Spin</button>;
 * }
 * ```
 */
export function useEvent(emitter: EventEmitter) {
  const unsubscribesRef = useRef<Array<() => void>>([]);

  const emit = useCallback(
    <T = unknown>(event: string, payload?: T) => {
      emitter.emit(event, payload);
    },
    [emitter],
  );

  const on = useCallback(
    <T = unknown>(event: string, listener: (payload: T) => void) => {
      const unsub = emitter.on<T>(event, listener);
      unsubscribesRef.current.push(unsub);
    },
    [emitter],
  );

  useEffect(() => {
    return () => {
      for (const unsub of unsubscribesRef.current) {
        unsub();
      }
      unsubscribesRef.current = [];
    };
  }, [emitter]);

  return { emit, on };
}
