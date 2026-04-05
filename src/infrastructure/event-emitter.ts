import type { GameEvent } from '../types/event';

/**
 * 標準イベント型の一覧。
 * GameCycleManager のフェーズ遷移やモジュール間通信で使用される。
 */
export const GAME_EVENTS: readonly GameEvent[] = [
  'spinStart',
  'reelStop',
  'win',
  'bonusStart',
  'modeChange',
  'zoneChange',
  'phaseChange',
  'creditChange',
  'notification',
] as const;

/**
 * モジュール間のイベント伝達を担うイベントバス。
 *
 * - 同一イベントへの複数リスナー登録
 * - ペイロードデータ渡し
 * - 未購読イベントの無視（エラーなし）
 * - `on` は購読解除関数を返す
 *
 * @example
 * ```ts
 * const emitter = new EventEmitter();
 * const unsub = emitter.on<number>('win', (payout) => console.log('Win:', payout));
 * emitter.emit('win', 100); // "Win: 100"
 * unsub(); // 購読解除
 * ```
 */
export class EventEmitter {
  private listeners = new Map<string, Set<(payload: unknown) => void>>();

  /**
   * イベントを発火し、登録済みの全リスナーにペイロードを配信する。
   * 購読者がいない場合は何もしない。
   *
   * @typeParam T - ペイロードの型
   * @param event - イベント名
   * @param payload - イベントペイロード（省略可）
   */
  emit<T = unknown>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      listener(payload as unknown);
    }
  }

  /**
   * イベントを購読する。
   *
   * @typeParam T - ペイロードの型
   * @param event - イベント名
   * @param listener - イベントリスナー関数
   * @returns 購読解除関数
   */
  on<T = unknown>(event: string, listener: (payload: T) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const wrapped = listener as (payload: unknown) => void;
    set.add(wrapped);

    return () => {
      this.off(event, wrapped);
    };
  }

  /**
   * イベントの購読を解除する。
   *
   * @param event - イベント名
   * @param listener - 解除するリスナー関数
   */
  off(event: string, listener: Function): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener as (payload: unknown) => void);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }
}
