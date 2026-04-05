import type { ThresholdConfig, ThresholdRange } from '../types/threshold';

/** Callback type for threshold reached events */
export type ThresholdReachedCallback = (counterName: string, value: number, action: string) => void;

/**
 * Checks if a threshold value is a ThresholdRange (min/max object).
 */
function isThresholdRange(threshold: number | ThresholdRange): threshold is ThresholdRange {
  return typeof threshold === 'object' && 'min' in threshold && 'max' in threshold;
}

/**
 * Resolves a threshold to a concrete number.
 * For fixed values, returns the value directly.
 * For ThresholdRange, picks a random integer in [min, max].
 */
function resolveThreshold(threshold: number | ThresholdRange, randomFn: () => number = Math.random): number {
  if (isThresholdRange(threshold)) {
    const { min, max } = threshold;
    return Math.floor(randomFn() * (max - min + 1)) + min;
  }
  return threshold;
}

/**
 * Validates a ThresholdConfig and throws on invalid values.
 */
function validateConfig(config: ThresholdConfig): void {
  const { threshold, counterName } = config;

  if (isThresholdRange(threshold)) {
    if (threshold.min <= 0 || threshold.max <= 0) {
      throw new Error(`Invalid threshold range for "${counterName}": min and max must be greater than 0`);
    }
    if (threshold.min > threshold.max) {
      throw new Error(`Invalid threshold range for "${counterName}": min (${threshold.min}) must not exceed max (${threshold.max})`);
    }
  } else {
    if (threshold <= 0) {
      throw new Error(`Invalid threshold for "${counterName}": threshold must be greater than 0`);
    }
  }
}

/**
 * SpinCounterの値を閾値と比較し、到達時にアクションを発火するモジュール。
 * 固定閾値とThresholdRange（振り分け天井）の両方をサポートする。
 * ThresholdRange使用時はカウンターリセット時に閾値を再抽選する。
 *
 * @example
 * ```ts
 * const trigger = new ThresholdTrigger([
 *   { counterName: 'normalSpins', targetGameMode: 'Normal', threshold: { min: 500, max: 800 }, action: 'forceBonus', resetCondition: 'BonusMode' },
 * ]);
 * trigger.onThresholdReached((name, value, action) => console.log(`${name}: ${value} → ${action}`));
 * trigger.check('normalSpins', 750); // 閾値到達時にコールバック発火
 * ```
 */
export class ThresholdTrigger {
  private configs: Map<string, ThresholdConfig> = new Map();
  private resolvedThresholds: Map<string, number> = new Map();
  private callbacks: ThresholdReachedCallback[] = [];
  private randomFn: () => number;

  constructor(configs: ThresholdConfig[] = [], randomFn?: () => number) {
    this.randomFn = randomFn ?? Math.random;

    for (const config of configs) {
      validateConfig(config);
      this.configs.set(config.counterName, config);
      this.resolvedThresholds.set(
        config.counterName,
        resolveThreshold(config.threshold, this.randomFn),
      );
    }
  }

  /**
   * カウンター値が閾値に到達したかチェックする。到達時はコールバックを発火しtrueを返す。
   *
   * @param counterName - カウンター名
   * @param value - 現在のカウンター値
   * @returns 閾値に到達した場合true
   */
  check(counterName: string, value: number): boolean {
    const threshold = this.resolvedThresholds.get(counterName);
    if (threshold === undefined) {
      return false;
    }

    if (value >= threshold) {
      const config = this.configs.get(counterName)!;
      for (const cb of this.callbacks) {
        cb(counterName, value, config.action);
      }
      return true;
    }

    return false;
  }

  /**
   * 閾値到達時のコールバックを登録する。
   *
   * @param callback - カウンター名、到達値、アクション名を受け取るコールバック
   */
  onThresholdReached(callback: ThresholdReachedCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * 閾値を再抽選する（ThresholdRange設定時）。固定閾値の場合は変更なし。
   *
   * @param counterName - カウンター名
   */
  reroll(counterName: string): void {
    const config = this.configs.get(counterName);
    if (!config) {
      return;
    }
    this.resolvedThresholds.set(
      counterName,
      resolveThreshold(config.threshold, this.randomFn),
    );
  }

  /**
   * 指定カウンターの現在の解決済み閾値を取得する。
   *
   * @param counterName - カウンター名
   * @returns 解決済み閾値。未定義の場合はundefined
   */
  getThreshold(counterName: string): number | undefined {
    return this.resolvedThresholds.get(counterName);
  }

  /**
   * 全カウンターの解決済み閾値をレコードとして取得する。
   *
   * @returns カウンター名と閾値のレコード
   */
  getAllThresholds(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, value] of this.resolvedThresholds) {
      result[name] = value;
    }
    return result;
  }
}
