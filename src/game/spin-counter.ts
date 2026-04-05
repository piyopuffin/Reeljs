import type { ThresholdConfig } from '../types/threshold';
import type { GameMode } from '../types/game-mode';

/**
 * カウンター設定。SpinCounterの各カウンターの名前、対象GameMode、リセット条件を定義する。
 *
 * @example
 * ```ts
 * const config: CounterConfig = {
 *   name: 'normalSpins',
 *   targetGameMode: 'Normal',
 *   resetCondition: 'BonusMode',
 * };
 * ```
 */
export interface CounterConfig {
  /** カウンター名 */
  name: string;
  /** カウント対象のGameMode */
  targetGameMode: GameMode;
  /** カウンターリセット条件（例: 'BonusMode'） */
  resetCondition: string;
}

/**
 * 複数のスピンカウンターを同時管理するモジュール。
 * 各カウンターは特定のGameMode中のスピン回数を累積カウントし、
 * リセット条件が満たされた場合に0にリセットされる。
 *
 * @example
 * ```ts
 * const counter = new SpinCounter([
 *   { name: 'normalSpins', targetGameMode: 'Normal', resetCondition: 'BonusMode' },
 * ]);
 * counter.increment('normalSpins');
 * console.log(counter.get('normalSpins')); // 1
 * counter.reset('normalSpins');
 * console.log(counter.get('normalSpins')); // 0
 * ```
 */
export class SpinCounter {
  private counters: Map<string, number> = new Map();
  private configs: Map<string, CounterConfig> = new Map();

  constructor(configs: CounterConfig[] = []) {
    for (const config of configs) {
      this.configs.set(config.name, config);
      this.counters.set(config.name, 0);
    }
  }

  /**
   * カウンター値を名前で取得する。未知のカウンターの場合は0を返す。
   *
   * @param name - カウンター名
   * @returns カウンター値
   */
  get(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  /**
   * カウンターをインクリメントする。存在しないカウンターの場合は新規作成する。
   *
   * @param name - カウンター名
   */
  increment(name: string): void {
    const current = this.counters.get(name) ?? 0;
    this.counters.set(name, current + 1);
  }

  /**
   * カウンターを0にリセットする。
   *
   * @param name - カウンター名
   */
  reset(name: string): void {
    this.counters.set(name, 0);
  }

  /**
   * 全カウンターの値をレコードとして取得する。
   *
   * @returns カウンター名と値のレコード
   */
  getAll(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, value] of this.counters) {
      result[name] = value;
    }
    return result;
  }

  /**
   * 指定カウンターの設定を取得する。
   *
   * @param name - カウンター名
   * @returns カウンター設定。未定義の場合はundefined
   */
  getConfig(name: string): CounterConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * リセット条件に一致するカウンターをリセットする。
   *
   * @param condition - リセット条件文字列
   * @returns リセットされたカウンター名の配列
   */
  checkResetCondition(condition: string): string[] {
    const resetCounters: string[] = [];
    for (const [name, config] of this.configs) {
      if (config.resetCondition === condition) {
        this.reset(name);
        resetCounters.push(name);
      }
    }
    return resetCounters;
  }
}
