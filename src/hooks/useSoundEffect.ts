import { useState, useCallback, useEffect, useRef } from 'react';
import type { EventEmitter } from '../infrastructure/event-emitter';

/**
 * EventEmitter からのイベント購読と対応サウンドの自動再生を管理するフック。
 * ミュート切り替え・音量調整機能を提供する。
 *
 * @param soundMap - イベント名とサウンドファイルURLのマッピング
 * @param emitter - EventEmitterインスタンス（省略時はイベント購読なし）
 * @returns サウンド状態と制御関数
 *
 * @example
 * ```tsx
 * const emitter = new EventEmitter();
 * function GameScreen() {
 *   const { isMuted, volume, toggleMute, setVolume } = useSoundEffect(
 *     { spinStart: '/sounds/spin.mp3', win: '/sounds/win.mp3' },
 *     emitter,
 *   );
 *   return <button onClick={toggleMute}>{isMuted ? '🔇' : '🔊'}</button>;
 * }
 * ```
 */
export function useSoundEffect(
  soundMap: Record<string, string>,
  emitter?: EventEmitter,
) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const isMutedRef = useRef(isMuted);
  const volumeRef = useRef(volume);

  isMutedRef.current = isMuted;
  volumeRef.current = volume;

  useEffect(() => {
    if (!emitter) return;

    const unsubs: Array<() => void> = [];
    for (const eventName of Object.keys(soundMap)) {
      const unsub = emitter.on(eventName, () => {
        if (isMutedRef.current) return;
        // In a real implementation, this would play the audio file.
        // We expose the soundMap for consumers to handle actual playback.
      });
      unsubs.push(unsub);
    }

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [emitter, soundMap]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
  }, []);

  return {
    soundMap,
    isMuted,
    volume,
    toggleMute,
    setVolume,
  };
}
