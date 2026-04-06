import type {
  ReelConfig,
  PayTable,
  Payline,
  PaylineResult,
  SpinResult,
  StopResult,
  StopTiming,
  WinningRole,
  GameMode,
  SymbolDefinition,
} from '../types';
import { InternalLottery } from './internal-lottery';
import type { InternalLotteryConfig } from './internal-lottery';
import { ReelController } from './reel-controller';
import type { ReelControllerConfig } from './reel-controller';

/**
 * SpinEngine ファサードの設定。リール設定、配当表、Payline定義、オプションの依存モジュールを含む。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const config: SpinEngineConfig = {
 *   reelConfigs: [{ symbols: [...], reelStrip: ['cherry', 'bell', 'bar'] }],
 *   payTable: { entries: [{ pattern: ['cherry', 'cherry', 'cherry'], payout: 10, roleType: 'SMALL_WIN' }] },
 *   paylines: [{ index: 0, positions: [1, 1, 1] }],
 * };
 * ```
 */
export interface SpinEngineConfig<S extends string = string> {
  reelConfigs: ReelConfig<S>[];
  payTable: PayTable<S>;
  paylines: Payline[];
  /** カスタム乱数生成関数 */
  randomFn?: () => number;
  /** 外部から注入する InternalLottery インスタンス */
  internalLottery?: InternalLottery;
  /** 外部から注入する ReelController インスタンス */
  reelController?: ReelController<S>;
}

/** MISS 用の WinningRole */
const MISS_ROLE: WinningRole = {
  id: 'miss',
  name: 'ハズレ',
  type: 'MISS',
  payout: 0,
  patterns: [],
  priority: 0,
};

/**
 * InternalLottery → ReelController → Payline評価を統合するファサード。
 *
 * 開発者は SpinEngine を直接使用するか、個別モジュール（InternalLottery、ReelController）を
 * 個別に使用するかを選択可能。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const engine = new SpinEngine({
 *   reelConfigs: [{ symbols: [...], reelStrip: ['cherry', 'bell', 'bar'] }],
 *   payTable: { entries: [] },
 *   paylines: [{ index: 0, positions: [1, 1, 1] }],
 * });
 * const result = engine.spin();
 * console.log(result.totalPayout);
 * ```
 */
export class SpinEngine<S extends string = string> {
  private readonly reelConfigs: ReelConfig<S>[];
  private readonly payTable: PayTable<S>;
  private readonly paylines: Payline[];
  private readonly randomFn: () => number;
  private readonly internalLottery: InternalLottery | null;
  private readonly reelController: ReelController<S>;
  /** デフォルトの行数（3行） */
  private readonly rowCount: number = 3;

  constructor(config: SpinEngineConfig<S>) {
    this.validateReelConfigs(config.reelConfigs);

    this.reelConfigs = config.reelConfigs;
    this.payTable = config.payTable;
    this.paylines = config.paylines;
    this.randomFn = config.randomFn ?? Math.random;

    // InternalLottery: 外部注入 or null（ランダムフォールバック）
    this.internalLottery = config.internalLottery ?? null;

    // ReelController: 外部注入 or 自動生成
    if (config.reelController) {
      this.reelController = config.reelController;
    } else {
      this.reelController = new ReelController<S>({
        reelStrips: config.reelConfigs.map((rc) => rc.reelStrip),
        randomFn: this.randomFn,
      });
    }
  }

  /**
   * 統合スピン実行。
   * winningRole が渡された場合は ReelController で出目制御を行い、
   * 渡されていない場合は重み付けランダム抽選にフォールバックする。
   *
   * @param winningRole - 内部当選役（省略時はランダムフォールバック）
   * @param stopTimings - 各リールのStopTiming配列（省略時はランダム生成）
   * @param options - BET額・有効Paylineインデックスのオプション
   * @returns スピン結果
   */
  spin(
    winningRole?: WinningRole,
    stopTimings?: StopTiming[],
    options?: { betAmount?: number; activePaylineIndices?: number[] },
  ): SpinResult<S> {
    const role = winningRole ?? MISS_ROLE;
    const betMultiplier = options?.betAmount ?? 1;

    let stopResults: StopResult[];

    if (winningRole) {
      stopResults = this.controlReels(winningRole, stopTimings);
    } else {
      stopResults = this.randomStopResults(stopTimings);
    }

    const grid = this.buildGrid(stopResults);

    // Payline filtering: use only active paylines if specified
    const activePaylines = options?.activePaylineIndices
      ? this.paylines.filter((pl) => options.activePaylineIndices!.includes(pl.index))
      : this.paylines;

    const winLines = this.evaluatePaylinesInternal(grid, activePaylines);

    // Apply bet multiplier to each win line payout
    const multipliedWinLines = winLines.map((wl) => ({
      ...wl,
      payout: wl.payout * betMultiplier,
    }));

    const totalPayout = multipliedWinLines.reduce((sum, wl) => sum + wl.payout, 0);
    const isMiss = stopResults.some((sr) => sr.isMiss);
    const isReplay = role.type === 'REPLAY';

    const result: SpinResult<S> = {
      grid,
      stopResults,
      winLines: multipliedWinLines,
      totalPayout,
      isReplay,
      isMiss,
      winningRole: role,
    };

    if (isMiss && winningRole) {
      result.missedRole = winningRole;
    }

    return result;
  }

  /**
   * InternalLottery のみ実行し、当選役を決定する。
   *
   * @param gameMode - 現在のゲームモード
   * @param difficulty - 設定段階（オプション）
   * @returns 当選役
   * @throws InternalLotteryが未設定の場合
   */
  lottery(gameMode: GameMode, difficulty?: number): WinningRole {
    if (!this.internalLottery) {
      throw new Error('InternalLottery is not configured. Provide an InternalLottery instance in SpinEngineConfig.');
    }
    return this.internalLottery.draw(gameMode, difficulty);
  }

  /**
   * ReelController のみ実行し、各リールの停止位置を決定する。
   *
   * @param winningRole - 内部当選役
   * @param stopTimings - 各リールのStopTiming配列（省略時はランダム生成）
   * @returns 各リールの停止結果
   */
  controlReels(winningRole: WinningRole, stopTimings?: StopTiming[]): StopResult[] {
    const reelCount = this.reelConfigs.length;
    const timings = stopTimings ?? this.generateRandomTimings();

    const results: StopResult[] = [];
    for (let i = 0; i < reelCount; i++) {
      results.push(
        this.reelController.determineStopPosition(i, winningRole, timings[i] ?? 0)
      );
    }
    return results;
  }

  /**
   * Payline 評価のみ実行（全Payline対象）。横・斜め・V字等のカスタムパターンに対応。
   *
   * @param grid - シンボルグリッド（grid[row][reel]）
   * @returns 当選ライン結果の配列
   */
  evaluatePaylines(grid: S[][]): PaylineResult<S>[] {
    return this.evaluatePaylinesInternal(grid, this.paylines);
  }

  /**
   * 指定されたPayline配列に対してPayline評価を実行する。
   */
  private evaluatePaylinesInternal(grid: S[][], paylines: Payline[]): PaylineResult<S>[] {
    const results: PaylineResult<S>[] = [];

    for (const payline of paylines) {
      const symbols: S[] = [];
      let valid = true;

      for (let reelIdx = 0; reelIdx < payline.positions.length; reelIdx++) {
        const rowIdx = payline.positions[reelIdx];
        if (grid[rowIdx] && grid[rowIdx][reelIdx] !== undefined) {
          symbols.push(grid[rowIdx][reelIdx]);
        } else {
          valid = false;
          break;
        }
      }

      if (!valid) continue;

      const matchedEntry = this.findPayTableMatch(symbols);
      if (matchedEntry) {
        results.push({
          lineIndex: payline.index,
          matchedSymbols: symbols,
          payout: matchedEntry.payout,
          payline,
        });
      }
    }

    return results;
  }

  /**
   * PayTable からシンボル配列にマッチするエントリを検索
   */
  private findPayTableMatch(symbols: S[]): { payout: number } | null {
    for (const entry of this.payTable.entries) {
      if (this.matchesPattern(symbols, entry.pattern as S[])) {
        return { payout: entry.payout };
      }
    }
    return null;
  }

  /**
   * シンボル配列がパターンにマッチするか判定
   * パターン内の 'ANY' はワイルドカードとして扱う
   */
  private matchesPattern(symbols: S[], pattern: S[]): boolean {
    if (symbols.length !== pattern.length) return false;
    for (let i = 0; i < symbols.length; i++) {
      if ((pattern[i] as string) !== 'ANY' && symbols[i] !== pattern[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * ランダムフォールバック: 重み付け抽選で各リールの停止位置を決定
   */
  private randomStopResults(stopTimings?: StopTiming[]): StopResult[] {
    const results: StopResult[] = [];
    for (let i = 0; i < this.reelConfigs.length; i++) {
      const reelConfig = this.reelConfigs[i];
      const position = this.weightedRandomPosition(reelConfig.symbols, reelConfig.reelStrip);
      const timing = stopTimings?.[i] ?? position;
      results.push({
        reelIndex: i,
        targetPosition: timing,
        actualPosition: position,
        slipCount: 0,
        isMiss: false,
      });
    }
    return results;
  }

  /**
   * 重み付けランダムでシンボルを選択し、ReelStrip 上の位置を返す
   */
  private weightedRandomPosition(symbols: SymbolDefinition<S>[], reelStrip: S[]): number {
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    const roll = this.randomFn() * totalWeight;
    let cumulative = 0;
    let selectedSymbol: S | null = null;

    for (const sym of symbols) {
      cumulative += sym.weight;
      if (roll < cumulative) {
        selectedSymbol = sym.id;
        break;
      }
    }

    if (selectedSymbol === null) {
      selectedSymbol = symbols[symbols.length - 1].id;
    }

    // ReelStrip 上で選択シンボルの位置を探す
    const idx = reelStrip.indexOf(selectedSymbol);
    return idx >= 0 ? idx : 0;
  }

  /**
   * ランダムな StopTiming を生成
   */
  private generateRandomTimings(): StopTiming[] {
    return this.reelConfigs.map((rc) =>
      Math.floor(this.randomFn() * rc.reelStrip.length)
    );
  }

  /**
   * グリッド生成: stopResults から grid[row][reel] を構築
   *
   * 各リールの actualPosition を中心に rowCount 行分のシンボルを取得する。
   */
  private buildGrid(stopResults: StopResult[]): S[][] {
    const grid: S[][] = [];
    for (let row = 0; row < this.rowCount; row++) {
      grid[row] = [];
      for (let reelIdx = 0; reelIdx < this.reelConfigs.length; reelIdx++) {
        const strip = this.reelConfigs[reelIdx].reelStrip;
        const stopPos = stopResults[reelIdx]?.actualPosition ?? 0;
        // 循環リストとして row オフセットを適用
        const pos = (stopPos + row) % strip.length;
        grid[row][reelIdx] = strip[pos];
      }
    }
    return grid;
  }

  /**
   * ReelConfig のバリデーション
   */
  private validateReelConfigs(reelConfigs: ReelConfig<S>[]): void {
    if (!reelConfigs || reelConfigs.length === 0) {
      throw new Error('ReelConfigs must not be empty');
    }

    for (let i = 0; i < reelConfigs.length; i++) {
      const rc = reelConfigs[i];

      if (!rc.symbols || rc.symbols.length === 0) {
        throw new Error(`ReelConfig for reel ${i} has an empty symbol list`);
      }

      if (!rc.reelStrip || rc.reelStrip.length === 0) {
        throw new Error(`ReelConfig for reel ${i} has an empty reelStrip`);
      }

      for (const sym of rc.symbols) {
        if (sym.weight < 0) {
          throw new Error(
            `Negative weight for symbol "${sym.id}" in reel ${i}: ${sym.weight}`
          );
        }
      }
    }
  }
}
