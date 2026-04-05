import { useState, useCallback, useRef } from 'react';
import type { ThresholdConfig } from '../types';
import { SpinCounter } from '../game/spin-counter';
import { ThresholdTrigger } from '../game/threshold-trigger';

/**
 * SpinCounter / ThresholdTrigger をラップし、カウンターと閾値のリアクティブ状態を提供するフック。
 * 各カウンターの現在値と設定された閾値をリアクティブに返却する。
 *
 * @param configs - 閾値トリガー設定の配列
 * @returns カウンター状態、閾値状態、resetCounter関数
 *
 * @example
 * ```tsx
 * function ThresholdDisplay() {
 *   const { counters, thresholds, resetCounter } = useThresholdTrigger([
 *     { counterName: 'normalSpins', targetGameMode: 'Normal', threshold: 1000, action: 'forceBonus', resetCondition: 'BonusMode' },
 *   ]);
 *   return <p>カウンター: {counters.normalSpins} / 天井: {thresholds.normalSpins}</p>;
 * }
 * ```
 */
export function useThresholdTrigger(configs: ThresholdConfig[]) {
  const counterRef = useRef<SpinCounter>(
    new SpinCounter(
      configs.map((c) => ({
        name: c.counterName,
        targetGameMode: c.targetGameMode,
        resetCondition: c.resetCondition,
      })),
    ),
  );
  const triggerRef = useRef<ThresholdTrigger>(new ThresholdTrigger(configs));

  const counter = counterRef.current;
  const trigger = triggerRef.current;

  const [counters, setCounters] = useState<Record<string, number>>(counter.getAll());
  const [thresholds, setThresholds] = useState<Record<string, number>>(trigger.getAllThresholds());

  const resetCounter = useCallback(
    (name: string) => {
      counter.reset(name);
      trigger.reroll(name);
      setCounters(counter.getAll());
      setThresholds(trigger.getAllThresholds());
    },
    [counter, trigger],
  );

  return {
    counters,
    thresholds,
    resetCounter,
    _counter: counter,
    _trigger: trigger,
    /** Sync state after external mutations */
    _sync: () => {
      setCounters(counter.getAll());
      setThresholds(trigger.getAllThresholds());
    },
  };
}
