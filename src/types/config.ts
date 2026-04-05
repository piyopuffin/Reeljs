import type { ReelConfig } from './symbol';
import type { Payline, PayTable } from './payline';
import type {
  BonusConfig,
  BonusType,
  BTConfig,
  ChanceConfig,
  ModeTransitionConfig,
  WinningRoleDefinition,
} from './game-mode';
import type { NotificationConfig } from './notification';
import type { ZoneConfig } from './zone';
import type { BetConfig } from './credit';
import type { ThresholdConfig } from './threshold';
import type { DifficultyConfig } from './difficulty';

/**
 * ゲーム全体設定。ConfigSerializerによるシリアライズ・デシリアライズの対象となる。
 * スロットゲームの全設定パラメータを一括管理する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const config: GameConfig = {
 *   reelConfigs: [],
 *   payTable: { entries: [] },
 *   paylines: [],
 *   modeTransitionConfig: { normalToChance: 0.02, chanceTobt: 0.3, btToSuperBigBonus: 0.1 },
 *   bonusConfigs: {} as any,
 *   btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [] },
 *   chanceConfig: { maxSpins: 20, maxPayout: 200, winPatterns: [] },
 *   notificationConfig: { enabledTypes: {}, targetRoleTypes: [] },
 *   zoneConfigs: {},
 *   betConfig: { initialCredit: 1000, betOptions: [1, 2, 3], defaultBet: 3 },
 *   thresholdConfigs: [],
 *   difficultyConfigs: {},
 *   winningRoleDefinitions: [],
 * };
 * ```
 */
export interface GameConfig<S extends string = string> {
  /** リール設定の配列 */
  reelConfigs: ReelConfig<S>[];
  /** 配当表 */
  payTable: PayTable<S>;
  /** Payline定義の配列 */
  paylines: Payline[];
  /** モード遷移確率設定 */
  modeTransitionConfig: ModeTransitionConfig;
  /** BonusTypeごとのボーナス設定 */
  bonusConfigs: Record<BonusType, BonusConfig>;
  /** BTモード設定 */
  btConfig: BTConfig;
  /** チャンスモード設定 */
  chanceConfig: ChanceConfig;
  /** 告知設定 */
  notificationConfig: NotificationConfig;
  /** ゾーン設定 */
  zoneConfigs: Record<string, ZoneConfig>;
  /** BET設定 */
  betConfig: BetConfig;
  /** 閾値トリガー設定の配列 */
  thresholdConfigs: ThresholdConfig[];
  /** 設定段階ごとのパラメータ */
  difficultyConfigs: Record<number, DifficultyConfig>;
  /** 小役定義の配列 */
  winningRoleDefinitions: WinningRoleDefinition[];
}
