/**
 * ゲームゾーン識別子。ゲーム全体を区間として分割する上位レイヤーの状態単位。
 * GameModeの上位概念として機能する（例: 通常区間、特別区間）。
 *
 * @example
 * ```ts
 * const zone: GameZone = 'normal';
 * ```
 */
export type GameZone = string;

/**
 * ゾーン設定。各ゾーンのゲーム数上限、差枚数上限、リセット対象、遷移先を定義する。
 *
 * @example
 * ```ts
 * const config: ZoneConfig = {
 *   name: '通常区間',
 *   maxGames: 1500,
 *   maxNetCredits: 2400,
 *   resetTargets: ['gameMode', 'spinCounter'],
 *   nextZone: 'special',
 *   isSpecial: false,
 * };
 * ```
 */
export interface ZoneConfig {
  /** ゾーンの表示名 */
  name: string;
  /** ゲーム数上限 */
  maxGames: number;
  /** 差枚数上限 */
  maxNetCredits: number;
  /** ゾーン終了時のリセット対象 */
  resetTargets: ('gameMode' | 'spinCounter')[];
  /** 遷移先ゾーン名 */
  nextZone: string;
  /** 特別区間かどうか */
  isSpecial: boolean;
}

/**
 * ゾーン状態。現在のゾーン、消化ゲーム数、累計差枚数を保持する。
 *
 * @example
 * ```ts
 * const state: ZoneState = {
 *   currentZone: 'normal',
 *   gamesPlayed: 150,
 *   netCredits: 300,
 * };
 * ```
 */
export interface ZoneState {
  /** 現在のゲームゾーン */
  currentZone: GameZone;
  /** ゾーン内消化ゲーム数 */
  gamesPlayed: number;
  /** ゾーン内累計差枚数 */
  netCredits: number;
}

/**
 * ゾーンインジケーター。現在のゾーンが通常区間か特別区間かを示す情報。
 *
 * @example
 * ```ts
 * const indicator: ZoneIndicator = {
 *   isSpecialZone: true,
 *   zoneName: '特別区間',
 * };
 * ```
 */
export interface ZoneIndicator {
  /** 特別区間かどうか */
  isSpecialZone: boolean;
  /** ゾーンの表示名 */
  zoneName: string;
}
