import type { DifficultyConfig, DifficultyPresetConfig } from '../types/difficulty';

/**
 * ゲーム全体の難易度を段階的に管理するモジュール。
 * 設定段階を切り替えることで、内部抽選確率・モード遷移確率・リプレイ確率を一括変更する。
 *
 * @example
 * ```ts
 * const preset = new DifficultyPreset({
 *   levels: {
 *     1: { level: 1, lotteryProbabilities: { cherry: 0.12 }, transitionProbabilities: {}, replayProbability: 0.16 },
 *     6: { level: 6, lotteryProbabilities: { cherry: 0.15 }, transitionProbabilities: {}, replayProbability: 0.18 },
 *   },
 *   initialLevel: 1,
 * });
 * preset.setDifficulty(6);
 * console.log(preset.currentConfig.replayProbability); // 0.18
 * ```
 */
export class DifficultyPreset {
  private _currentLevel: number;
  private readonly levels: Record<number, DifficultyConfig>;

  constructor(config: DifficultyPresetConfig) {
    this.validateConfig(config);
    this.levels = config.levels;
    this._currentLevel = config.initialLevel;
  }

  /** 現在の設定段階 */
  get currentLevel(): number {
    return this._currentLevel;
  }

  /** 現在のDifficultyConfig */
  get currentConfig(): DifficultyConfig {
    return this.levels[this._currentLevel];
  }

  /**
   * 設定段階変更。指定した段階のDifficultyConfigに切り替える。
   *
   * @param level - 設定段階番号
   * @throws 未定義の設定段階が指定された場合
   */
  setDifficulty(level: number): void {
    if (!(level in this.levels)) {
      throw new Error(`Invalid difficulty level: ${level}. Available levels: ${Object.keys(this.levels).join(', ')}`);
    }
    this._currentLevel = level;
  }

  /**
   * 利用可能な設定段階一覧を取得する。
   *
   * @returns 設定段階番号の配列
   */
  getAvailableLevels(): number[] {
    return Object.keys(this.levels).map(Number);
  }

  private validateConfig(config: DifficultyPresetConfig): void {
    if (!config.levels || Object.keys(config.levels).length === 0) {
      throw new Error('DifficultyPresetConfig must have at least one level defined');
    }

    if (!(config.initialLevel in config.levels)) {
      throw new Error(`Initial level ${config.initialLevel} is not defined in levels`);
    }

    for (const [levelKey, diffConfig] of Object.entries(config.levels)) {
      this.validateDifficultyConfig(Number(levelKey), diffConfig);
    }
  }

  private validateDifficultyConfig(level: number, config: DifficultyConfig): void {
    // Validate lottery probabilities
    for (const [key, value] of Object.entries(config.lotteryProbabilities)) {
      if (value < 0 || value > 1) {
        throw new Error(`Invalid lottery probability for "${key}" at level ${level}: ${value}. Must be between 0 and 1`);
      }
    }

    // Validate transition probabilities
    if (config.transitionProbabilities) {
      for (const [key, value] of Object.entries(config.transitionProbabilities)) {
        if (value !== undefined && (value < 0 || value > 1)) {
          throw new Error(`Invalid transition probability for "${key}" at level ${level}: ${value}. Must be between 0 and 1`);
        }
      }
    }

    // Validate replay probability
    if (config.replayProbability < 0 || config.replayProbability > 1) {
      throw new Error(`Invalid replay probability at level ${level}: ${config.replayProbability}. Must be between 0 and 1`);
    }
  }
}
