import type { ZoneConfig, ZoneState, ZoneIndicator, SpinResult } from '../types';

/**
 * ゾーンマネージャー設定。ゾーン定義と初期ゾーンを含む。
 *
 * @example
 * ```ts
 * const config: ZoneManagerConfig = {
 *   zones: {
 *     normal: { name: '通常区間', maxGames: 1500, maxNetCredits: 2400, resetTargets: [], nextZone: 'special', isSpecial: false },
 *   },
 *   initialZone: 'normal',
 * };
 * ```
 */
export interface ZoneManagerConfig {
  zones: Record<string, ZoneConfig>;
  initialZone: string;
}

/**
 * ゲームゾーン管理モジュール。複数のGameZone（通常区間、特別区間等）を管理し、
 * ゲーム数上限・差枚数上限の監視とゾーン終了時の強制リセットを担当する。
 *
 * @example
 * ```ts
 * const manager = new ZoneManager({
 *   zones: {
 *     normal: { name: '通常区間', maxGames: 1500, maxNetCredits: 2400, resetTargets: ['gameMode'], nextZone: 'special', isSpecial: false },
 *     special: { name: '特別区間', maxGames: 500, maxNetCredits: 1000, resetTargets: [], nextZone: 'normal', isSpecial: true },
 *   },
 *   initialZone: 'normal',
 * });
 * console.log(manager.currentState.currentZone); // 'normal'
 * ```
 */
export class ZoneManager {
  private readonly zones: Record<string, ZoneConfig>;
  private _state: ZoneState;
  private _onZoneChangeCallbacks: Array<(from: string, to: string) => void> = [];
  private _resetCallbacks: Array<(targets: ('gameMode' | 'spinCounter')[]) => void> = [];

  constructor(config: ZoneManagerConfig) {
    this.validateConfig(config);
    this.zones = config.zones;
    this._state = {
      currentZone: config.initialZone,
      gamesPlayed: 0,
      netCredits: 0,
    };
  }

  /** 現在のZoneState */
  get currentState(): ZoneState {
    return { ...this._state };
  }

  /** ZoneIndicator */
  get indicator(): ZoneIndicator {
    const zoneConfig = this.zones[this._state.currentZone];
    return {
      isSpecialZone: zoneConfig.isSpecial,
      zoneName: zoneConfig.name,
    };
  }

  /**
   * ゾーン更新。SpinResult に基づいてゲーム数・差枚数を更新し、ゾーン終了判定を行う。
   *
   * @param spinResult - スピン結果
   */
  update(spinResult: SpinResult): void {
    this._state.gamesPlayed += 1;
    this._state.netCredits += spinResult.totalPayout;

    const zoneConfig = this.zones[this._state.currentZone];

    if (
      this._state.gamesPlayed >= zoneConfig.maxGames ||
      this._state.netCredits >= zoneConfig.maxNetCredits
    ) {
      this.transitionTo(zoneConfig.nextZone, zoneConfig.resetTargets);
    }
  }

  /**
   * ゾーン遷移コールバック登録。ゾーン遷移時に遷移元・遷移先を受け取るコールバックを登録する。
   *
   * @param callback - 遷移元ゾーンと遷移先ゾーンを受け取るコールバック
   */
  onZoneChange(callback: (from: string, to: string) => void): void {
    this._onZoneChangeCallbacks.push(callback);
  }

  /**
   * リセットコールバック登録（GameCycleManager等が利用）
   */
  onReset(callback: (targets: ('gameMode' | 'spinCounter')[]) => void): void {
    this._resetCallbacks.push(callback);
  }

  /**
   * ゾーン遷移処理
   */
  private transitionTo(nextZone: string, resetTargets: ('gameMode' | 'spinCounter')[]): void {
    const fromZone = this._state.currentZone;

    // リセット対象の強制リセットを通知
    for (const cb of this._resetCallbacks) {
      cb(resetTargets);
    }

    // ゾーン遷移: カウンターリセット
    this._state = {
      currentZone: nextZone,
      gamesPlayed: 0,
      netCredits: 0,
    };

    // コールバック発火
    for (const cb of this._onZoneChangeCallbacks) {
      cb(fromZone, nextZone);
    }
  }

  /**
   * 設定バリデーション
   */
  private validateConfig(config: ZoneManagerConfig): void {
    if (!config.zones || Object.keys(config.zones).length === 0) {
      throw new Error('zones must not be empty');
    }

    if (!config.initialZone || !(config.initialZone in config.zones)) {
      throw new Error(
        `initialZone "${config.initialZone}" is not defined in zones`
      );
    }

    for (const [key, zone] of Object.entries(config.zones)) {
      if (zone.maxGames <= 0) {
        throw new Error(
          `Zone "${key}": maxGames must be greater than 0, got ${zone.maxGames}`
        );
      }
      if (zone.maxNetCredits <= 0) {
        throw new Error(
          `Zone "${key}": maxNetCredits must be greater than 0, got ${zone.maxNetCredits}`
        );
      }
      if (!(zone.nextZone in config.zones)) {
        throw new Error(
          `Zone "${key}": nextZone "${zone.nextZone}" is not defined in zones`
        );
      }
    }
  }
}
