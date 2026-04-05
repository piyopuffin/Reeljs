import type { ReelStrip, StopResult, StopTiming, WinningRole } from '../types';

/**
 * 出目制御モジュールの設定。リールストリップ、引き込み範囲、AutoStop等を定義する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const config: ReelControllerConfig = {
 *   reelStrips: [['cherry', 'bell', 'bar'], ['bell', 'bar', 'seven'], ['bar', 'seven', 'cherry']],
 *   slipRanges: [4, 4, 4],
 *   autoStop: false,
 * };
 * ```
 */
export interface ReelControllerConfig<S extends string = string> {
  /** 各リールのReelStrip */
  reelStrips: ReelStrip<S>[];
  /** 各リールのSlipRange（デフォルト: 4） */
  slipRanges?: number[];
  /** AutoStopモード */
  autoStop?: boolean;
  /** 停止順序 */
  stopOrder?: number[];
  /** 持ち越し設定 */
  carryOverEnabled?: boolean;
  /** カスタム乱数生成関数 */
  randomFn?: () => number;
}

/**
 * 出目制御モジュール。InternalLotteryの当選役に基づいて各リールの停止位置を制御する。
 * 引き込み（Slip）・蹴飛ばし（Reject）処理、AutoStop、取りこぼし判定を提供する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const controller = new ReelController({
 *   reelStrips: [['cherry', 'bell', 'bar', 'seven']],
 *   slipRanges: [4],
 * });
 * const result = controller.determineStopPosition(0, winningRole, 2);
 * console.log(result.actualPosition, result.isMiss);
 * ```
 */
export class ReelController<S extends string = string> {
  private readonly reelStrips: ReelStrip<S>[];
  private readonly slipRanges: number[];
  private readonly autoStop: boolean;
  private readonly stopOrder: number[];
  private readonly carryOverEnabled: boolean;
  private readonly randomFn: () => number;
  private readonly stopCallbacks: Array<(result: StopResult) => void> = [];

  constructor(config: ReelControllerConfig<S>) {
    this.validateConfig(config);

    this.reelStrips = config.reelStrips;
    this.slipRanges = config.slipRanges ?? config.reelStrips.map(() => 4);
    this.autoStop = config.autoStop ?? false;
    this.stopOrder = config.stopOrder ?? config.reelStrips.map((_, i) => i);
    this.carryOverEnabled = config.carryOverEnabled ?? false;
    this.randomFn = config.randomFn ?? Math.random;
  }

  /**
   * 停止位置決定。当選役のパターンに基づいて引き込み（Slip）・蹴飛ばし（Reject）を適用し、
   * 最終停止位置を決定する。
   *
   * @param reelIndex - リールインデックス（0始まり）
   * @param winningRole - 内部当選役
   * @param stopTiming - プレイヤーの停止タイミング
   * @returns 停止結果
   * @throws リールインデックスまたはStopTimingが範囲外の場合
   */
  determineStopPosition(
    reelIndex: number,
    winningRole: WinningRole,
    stopTiming: StopTiming
  ): StopResult {
    const strip = this.reelStrips[reelIndex];
    if (!strip) {
      throw new Error(`Invalid reelIndex: ${reelIndex}`);
    }

    if (stopTiming < 0 || stopTiming >= strip.length) {
      throw new Error(
        `StopTiming ${stopTiming} is out of range for reel ${reelIndex} (0-${strip.length - 1})`
      );
    }

    const slipRange = this.slipRanges[reelIndex] ?? 4;

    // Collect target symbols for this reel from winning role patterns
    const targetSymbols = this.getTargetSymbols(reelIndex, winningRole);

    // If MISS or no target symbols for this reel, apply reject logic
    if (winningRole.type === 'MISS' || targetSymbols.length === 0) {
      const result: StopResult = {
        reelIndex,
        targetPosition: stopTiming,
        actualPosition: stopTiming,
        slipCount: 0,
        isMiss: false,
      };
      this.notifyStop(result);
      return result;
    }

    // Try slip (pull-in): find target symbol within SlipRange
    const slipResult = this.trySlip(reelIndex, stopTiming, targetSymbols, slipRange);

    if (slipResult !== null) {
      // Slip success — pull-in to target position
      const result: StopResult = {
        reelIndex,
        targetPosition: stopTiming,
        actualPosition: slipResult.position,
        slipCount: slipResult.slipCount,
        isMiss: false,
      };
      this.notifyStop(result);
      return result;
    }

    // Slip failed — target symbol is beyond SlipRange → Miss
    // Apply reject: shift away from non-winning symbols if needed
    const rejectPosition = this.applyReject(reelIndex, stopTiming, targetSymbols, slipRange);

    const result: StopResult = {
      reelIndex,
      targetPosition: stopTiming,
      actualPosition: rejectPosition,
      slipCount: this.circularDistance(stopTiming, rejectPosition, strip.length),
      isMiss: true,
    };
    this.notifyStop(result);
    return result;
  }

  /**
   * AutoStop実行。全リールをランダムタイミングで停止する。
   *
   * @param winningRole - 内部当選役
   * @returns 全リールの停止結果
   */
  autoStopAll(winningRole: WinningRole): StopResult[] {
    const results: StopResult[] = [];
    for (const reelIndex of this.stopOrder) {
      const strip = this.reelStrips[reelIndex];
      const randomTiming = Math.floor(this.randomFn() * strip.length);
      results.push(this.determineStopPosition(reelIndex, winningRole, randomTiming));
    }
    return results;
  }

  /**
   * 停止コールバック登録。リール停止時にStopResultを受け取るコールバックを登録する。
   *
   * @param callback - 停止結果を受け取るコールバック関数
   */
  onStop(callback: (result: StopResult) => void): void {
    this.stopCallbacks.push(callback);
  }

  /**
   * AutoStopモードかどうかを返す
   */
  get isAutoStop(): boolean {
    return this.autoStop;
  }

  /**
   * 持ち越し設定が有効かどうかを返す
   */
  get isCarryOverEnabled(): boolean {
    return this.carryOverEnabled;
  }

  /**
   * 停止順序を返す
   */
  getStopOrder(): number[] {
    return [...this.stopOrder];
  }

  /**
   * 指定リールのReelStripを返す
   */
  getReelStrip(reelIndex: number): ReelStrip<S> {
    const strip = this.reelStrips[reelIndex];
    if (!strip) {
      throw new Error(`Invalid reelIndex: ${reelIndex}`);
    }
    return [...strip];
  }

  /**
   * 当選役パターンからリール別のターゲットシンボルを取得
   */
  private getTargetSymbols(reelIndex: number, winningRole: WinningRole): string[] {
    const symbols: string[] = [];
    for (const pattern of winningRole.patterns) {
      if (reelIndex < pattern.length) {
        const sym = pattern[reelIndex];
        if (sym !== 'ANY' && !symbols.includes(sym)) {
          symbols.push(sym);
        }
      }
    }
    return symbols;
  }

  /**
   * 引き込み（Slip）を試行する
   *
   * stopTimingからSlipRange以内にターゲットシンボルがあれば、
   * その位置と引き込みコマ数を返す。なければnull。
   */
  private trySlip(
    reelIndex: number,
    stopTiming: number,
    targetSymbols: string[],
    slipRange: number
  ): { position: number; slipCount: number } | null {
    const strip = this.reelStrips[reelIndex];
    const len = strip.length;

    // Check positions from stopTiming forward (circular) up to slipRange
    for (let offset = 0; offset <= slipRange; offset++) {
      const pos = (stopTiming + offset) % len;
      if (targetSymbols.includes(strip[pos])) {
        return { position: pos, slipCount: offset };
      }
    }

    return null;
  }

  /**
   * 蹴飛ばし（Reject）を適用する
   *
   * 非当選役のシンボルが表示されないように停止位置をずらす。
   * stopTimingからSlipRange以内で、ターゲットシンボルでない位置を探す。
   */
  private applyReject(
    reelIndex: number,
    stopTiming: number,
    targetSymbols: string[],
    slipRange: number
  ): number {
    const strip = this.reelStrips[reelIndex];
    const len = strip.length;

    // Find a position within SlipRange that does NOT show a target symbol
    for (let offset = 0; offset <= slipRange; offset++) {
      const pos = (stopTiming + offset) % len;
      if (!targetSymbols.includes(strip[pos])) {
        return pos;
      }
    }

    // Fallback: return stopTiming if all positions within range are target symbols
    return stopTiming;
  }

  /**
   * 循環距離を計算する
   */
  private circularDistance(from: number, to: number, length: number): number {
    return (to - from + length) % length;
  }

  /**
   * 停止コールバックを通知する
   */
  private notifyStop(result: StopResult): void {
    for (const cb of this.stopCallbacks) {
      cb(result);
    }
  }

  /**
   * 設定のバリデーション
   */
  private validateConfig(config: ReelControllerConfig<S>): void {
    // Empty ReelStrips check
    if (!config.reelStrips || config.reelStrips.length === 0) {
      throw new Error('ReelStrips must not be empty');
    }

    for (let i = 0; i < config.reelStrips.length; i++) {
      if (!config.reelStrips[i] || config.reelStrips[i].length === 0) {
        throw new Error(`ReelStrip for reel ${i} must not be empty`);
      }
    }

    // Negative SlipRange check
    if (config.slipRanges) {
      for (let i = 0; i < config.slipRanges.length; i++) {
        if (config.slipRanges[i] < 0) {
          throw new Error(`SlipRange for reel ${i} must not be negative: ${config.slipRanges[i]}`);
        }
      }
    }

    // StopOrder validation
    if (config.stopOrder) {
      for (const idx of config.stopOrder) {
        if (idx < 0 || idx >= config.reelStrips.length) {
          throw new Error(
            `StopOrder contains invalid reel index: ${idx} (valid: 0-${config.reelStrips.length - 1})`
          );
        }
      }
    }
  }
}
