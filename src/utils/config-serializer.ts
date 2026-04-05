import type { GameConfig } from '../types';

/** Required top-level fields of GameConfig */
const REQUIRED_FIELDS: (keyof GameConfig)[] = [
  'reelConfigs',
  'payTable',
  'paylines',
  'modeTransitionConfig',
  'bonusConfigs',
  'btConfig',
  'chanceConfig',
  'notificationConfig',
  'zoneConfigs',
  'betConfig',
  'thresholdConfigs',
  'difficultyConfigs',
  'winningRoleDefinitions',
];

/**
 * GameConfig のシリアライズ・デシリアライズ・バリデーションを提供するユーティリティ。
 * JSON文字列との相互変換とラウンドトリップ特性を保証する。
 *
 * @example
 * ```ts
 * const json = ConfigSerializer.serialize(gameConfig);
 * const restored = ConfigSerializer.deserialize(json);
 * const isValid = ConfigSerializer.validate(someObject);
 * ```
 */
export const ConfigSerializer = {
  /**
   * GameConfig を JSON 文字列にシリアライズする。
   *
   * @param config - シリアライズ対象のGameConfig
   * @returns JSON文字列
   */
  serialize(config: GameConfig): string {
    return JSON.stringify(config);
  },

  /**
   * JSON 文字列を GameConfig にデシリアライズする。
   *
   * @param json - デシリアライズ対象のJSON文字列
   * @returns パースされたGameConfig
   * @throws 不正な JSON の場合はパースエラー
   * @throws 必須フィールド欠落の場合はバリデーションエラー
   */
  deserialize(json: string): GameConfig {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse JSON: ${message}`);
    }

    if (!ConfigSerializer.validate(parsed)) {
      // validate が false を返した場合、欠落フィールドを特定してエラーにする
      const missing = getMissingFields(parsed);
      throw new Error(
        `Invalid GameConfig: missing required fields: ${missing.join(', ')}`
      );
    }

    return parsed;
  },

  /**
   * 値が有効な GameConfig かどうかを検証する型ガード。
   *
   * @param config - 検証対象の値
   * @returns GameConfigとして有効な場合true
   */
  validate(config: unknown): config is GameConfig {
    if (config === null || typeof config !== 'object') {
      return false;
    }
    const obj = config as Record<string, unknown>;
    return REQUIRED_FIELDS.every(
      (field) => field in obj && obj[field] !== undefined
    );
  },
};

/**
 * 欠落している必須フィールド名の一覧を返す
 */
function getMissingFields(value: unknown): string[] {
  if (value === null || typeof value !== 'object') {
    return [...REQUIRED_FIELDS];
  }
  const obj = value as Record<string, unknown>;
  return REQUIRED_FIELDS.filter(
    (field) => !(field in obj) || obj[field] === undefined
  );
}
