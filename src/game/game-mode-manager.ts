import type {
  GameMode,
  BonusType,
  BonusConfig,
  BTConfig,
  ChanceConfig,
  ModeTransitionConfig,
  WinPattern,
  SpinResult,
  WinningRole,
} from '../types';

/**
 * GameModeManager の設定。モード遷移確率、ボーナス設定、BT/チャンスモード設定を含む。
 *
 * @example
 * ```ts
 * const config: GameModeManagerConfig = {
 *   transitionConfig: { normalToChance: 0.02, chanceTobt: 0.3, btToSuperBigBonus: 0.1 },
 *   bonusConfigs: {
 *     SUPER_BIG_BONUS: { type: 'SUPER_BIG_BONUS', payoutMultiplier: 3, maxSpins: 50, maxPayout: 500 },
 *     BIG_BONUS: { type: 'BIG_BONUS', payoutMultiplier: 2, maxSpins: 30, maxPayout: 300 },
 *     REG_BONUS: { type: 'REG_BONUS', payoutMultiplier: 1, maxSpins: 15, maxPayout: 150 },
 *   },
 *   btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [] },
 *   chanceConfig: { maxSpins: 20, maxPayout: 200, winPatterns: [] },
 * };
 * ```
 */
export interface GameModeManagerConfig {
  /** モード遷移確率設定 */
  transitionConfig: ModeTransitionConfig;
  /** ボーナス設定（BonusType ごと） */
  bonusConfigs: Record<BonusType, BonusConfig>;
  /** BTモード設定 */
  btConfig: BTConfig;
  /** チャンスモード設定 */
  chanceConfig: ChanceConfig;
  /** カスタム乱数生成関数 */
  randomFn?: () => number;
}

/** モード内部状態 */
interface ModeState {
  remainingSpins: number | null;
  accumulatedPayout: number;
  maxPayout: number | null;
}

/**
 * ゲームモードの状態遷移を管理するステートマシン。
 * Normal, Chance, Bonus, BT の4種類のモードを管理し、
 * スピン結果と当選役に基づいてモード遷移を判定する。
 *
 * @example
 * ```ts
 * const manager = new GameModeManager({
 *   transitionConfig: { normalToChance: 0.02, chanceTobt: 0.3, btToSuperBigBonus: 0.1 },
 *   bonusConfigs: { SUPER_BIG_BONUS: { ... }, BIG_BONUS: { ... }, REG_BONUS: { ... } },
 *   btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [] },
 *   chanceConfig: { maxSpins: 20, maxPayout: 200, winPatterns: [] },
 * });
 * console.log(manager.currentMode); // 'Normal'
 * ```
 */
export class GameModeManager {
  private _currentMode: GameMode = 'Normal';
  private _currentBonusType: BonusType | null = null;
  private _modeChangeCallbacks: Array<(from: GameMode, to: GameMode) => void> = [];
  private _modeState: ModeState = {
    remainingSpins: null,
    accumulatedPayout: 0,
    maxPayout: null,
  };

  private readonly transitionConfig: ModeTransitionConfig;
  private readonly bonusConfigs: Record<BonusType, BonusConfig>;
  private readonly btConfig: BTConfig;
  private readonly chanceConfig: ChanceConfig;
  private readonly randomFn: () => number;

  constructor(config: GameModeManagerConfig) {
    this.validateConfig(config);
    this.transitionConfig = config.transitionConfig;
    this.bonusConfigs = config.bonusConfigs;
    this.btConfig = config.btConfig;
    this.chanceConfig = config.chanceConfig;
    this.randomFn = config.randomFn ?? Math.random;
  }

  /** 現在のGameMode */
  get currentMode(): GameMode {
    return this._currentMode;
  }

  /** 現在のBonusType（BonusMode時のみ） */
  get currentBonusType(): BonusType | null {
    return this._currentBonusType;
  }

  /**
   * 残りスピン数を取得する
   * @returns 残りスピン数。NormalMode時はnull
   */
  getRemainingSpins(): number | null {
    return this._modeState.remainingSpins;
  }

  /**
   * 累計獲得配当を取得する
   * @returns 現在モードでの累計配当
   */
  getAccumulatedPayout(): number {
    return this._modeState.accumulatedPayout;
  }

  /**
   * モード遷移コールバックを登録する
   * @param callback 遷移元モードと遷移先モードを受け取るコールバック
   */
  onModeChange(callback: (from: GameMode, to: GameMode) => void): void {
    this._modeChangeCallbacks.push(callback);
  }

  /**
   * スピン結果と当選役に基づいてモード遷移を判定する
   * @param spinResult スピン結果
   * @param winningRole 内部当選役
   * @returns 遷移後のGameMode
   */
  evaluateTransition(spinResult: SpinResult, winningRole: WinningRole): GameMode {
    const previousMode = this._currentMode;

    // 残りスピン数のデクリメントと配当の累積
    if (this._modeState.remainingSpins !== null) {
      this._modeState.remainingSpins--;
      this._modeState.accumulatedPayout += spinResult.totalPayout;
    }

    switch (this._currentMode) {
      case 'Normal':
        return this.evaluateNormalTransition(spinResult, winningRole);
      case 'Chance':
        return this.evaluateChanceTransition(spinResult, winningRole);
      case 'Bonus':
        return this.evaluateBonusTransition(spinResult, winningRole);
      case 'BT':
        return this.evaluateBTTransition(spinResult, winningRole);
      default:
        return this._currentMode;
    }
  }

  /**
   * モードに応じた SpinEngine パラメータ情報を返す
   * @returns 現在のモードに対応するパラメータキー
   */
  getSpinEngineParams(): { mode: GameMode; bonusType: BonusType | null } {
    return {
      mode: this._currentMode,
      bonusType: this._currentBonusType,
    };
  }

  // --- Normal モードの遷移判定 ---
  private evaluateNormalTransition(spinResult: SpinResult, winningRole: WinningRole): GameMode {
    // ボーナス当選（InternalLottery 経由）
    if (winningRole.type === 'BONUS' && winningRole.bonusType) {
      this.transitionToBonus(winningRole.bonusType);
      return this._currentMode;
    }

    // チャンスモード遷移（確率判定）
    if (this.randomFn() < this.transitionConfig.normalToChance) {
      this.transitionTo('Chance');
      this.initModeState(this.chanceConfig.maxSpins, this.chanceConfig.maxPayout);
      return this._currentMode;
    }

    return this._currentMode;
  }

  // --- Chance モードの遷移判定 ---
  private evaluateChanceTransition(spinResult: SpinResult, winningRole: WinningRole): GameMode {
    // MaxPayout 到達チェック
    if (this._modeState.maxPayout !== null && this._modeState.accumulatedPayout >= this._modeState.maxPayout) {
      this.transitionTo('Normal');
      this.resetModeState();
      return this._currentMode;
    }

    // WinPattern 成立 → BT へ遷移
    if (this.matchesWinPattern(spinResult, this.chanceConfig.winPatterns)) {
      this.transitionTo('BT');
      this.initModeState(this.btConfig.maxSpins, this.btConfig.maxPayout);
      return this._currentMode;
    }

    // 継続スピン数上限到達 → Normal へ
    if (this._modeState.remainingSpins !== null && this._modeState.remainingSpins <= 0) {
      this.transitionTo('Normal');
      this.resetModeState();
      return this._currentMode;
    }

    return this._currentMode;
  }

  // --- Bonus モードの遷移判定 ---
  private evaluateBonusTransition(_spinResult: SpinResult, _winningRole: WinningRole): GameMode {
    if (!this._currentBonusType) {
      return this._currentMode;
    }

    // MaxPayout 到達チェック
    if (this._modeState.maxPayout !== null && this._modeState.accumulatedPayout >= this._modeState.maxPayout) {
      return this.endBonus();
    }

    // 継続スピン数上限到達
    if (this._modeState.remainingSpins !== null && this._modeState.remainingSpins <= 0) {
      return this.endBonus();
    }

    return this._currentMode;
  }

  // --- BT モードの遷移判定 ---
  private evaluateBTTransition(spinResult: SpinResult, _winningRole: WinningRole): GameMode {
    // MaxPayout 到達チェック
    if (this._modeState.maxPayout !== null && this._modeState.accumulatedPayout >= this._modeState.maxPayout) {
      this.transitionTo('Normal');
      this.resetModeState();
      return this._currentMode;
    }

    // WinPattern 成立 → SUPER_BIG_BONUS 再突入
    if (this.matchesWinPattern(spinResult, this.btConfig.winPatterns)) {
      this.transitionToBonus('SUPER_BIG_BONUS');
      return this._currentMode;
    }

    // 継続スピン数上限到達 → Normal へ
    if (this._modeState.remainingSpins !== null && this._modeState.remainingSpins <= 0) {
      this.transitionTo('Normal');
      this.resetModeState();
      return this._currentMode;
    }

    return this._currentMode;
  }

  // --- ボーナス終了処理 ---
  private endBonus(): GameMode {
    const bonusType = this._currentBonusType;
    this._currentBonusType = null;

    if (bonusType === 'SUPER_BIG_BONUS') {
      // SUPER_BIG_BONUS → BT
      this.transitionTo('BT');
      this.initModeState(this.btConfig.maxSpins, this.btConfig.maxPayout);
    } else {
      // BIG_BONUS / REG_BONUS → Normal
      this.transitionTo('Normal');
      this.resetModeState();
    }

    return this._currentMode;
  }

  // --- ボーナスモードへの遷移 ---
  private transitionToBonus(bonusType: BonusType): void {
    const config = this.bonusConfigs[bonusType];
    this._currentBonusType = bonusType;
    this.transitionTo('Bonus');
    this.initModeState(config.maxSpins, config.maxPayout);
  }

  // --- モード遷移の実行 ---
  private transitionTo(newMode: GameMode): void {
    const from = this._currentMode;
    this.validateTransition(from, newMode);
    this._currentMode = newMode;
    for (const cb of this._modeChangeCallbacks) {
      cb(from, newMode);
    }
  }

  // --- モード内部状態の初期化 ---
  private initModeState(maxSpins: number, maxPayout: number): void {
    this._modeState = {
      remainingSpins: maxSpins,
      accumulatedPayout: 0,
      maxPayout,
    };
  }

  // --- モード内部状態のリセット ---
  private resetModeState(): void {
    this._modeState = {
      remainingSpins: null,
      accumulatedPayout: 0,
      maxPayout: null,
    };
  }

  // --- WinPattern マッチング ---
  private matchesWinPattern(spinResult: SpinResult, patterns: WinPattern[]): boolean {
    const grid = spinResult.grid;
    for (const pattern of patterns) {
      if (this.matchesSinglePattern(grid, pattern)) {
        return true;
      }
    }
    return false;
  }

  private matchesSinglePattern(grid: string[][], pattern: WinPattern): boolean {
    const { symbols, positions } = pattern;

    if (positions && positions.length > 0) {
      // 特定位置でのマッチング
      for (let col = 0; col < symbols.length; col++) {
        const row = positions[col];
        if (row === undefined || row >= grid.length || col >= (grid[0]?.length ?? 0)) {
          return false;
        }
        if (grid[row][col] !== symbols[col]) {
          return false;
        }
      }
      return true;
    }

    // 位置指定なし: いずれかの行で全シンボルが一致
    for (let row = 0; row < grid.length; row++) {
      let match = true;
      for (let col = 0; col < symbols.length; col++) {
        if (col >= (grid[row]?.length ?? 0) || grid[row][col] !== symbols[col]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  // --- 遷移バリデーション ---
  private validateTransition(from: GameMode, to: GameMode): void {
    const validTransitions: Record<GameMode, GameMode[]> = {
      Normal: ['Chance', 'Bonus'],
      Chance: ['BT', 'Normal'],
      Bonus: ['Normal', 'BT'],
      BT: ['Normal', 'Bonus'],
    };

    const allowed = validTransitions[from];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid mode transition: ${from} → ${to}`);
    }
  }

  // --- 設定バリデーション ---
  private validateConfig(config: GameModeManagerConfig): void {
    this.validateProbability('normalToChance', config.transitionConfig.normalToChance);
    this.validateProbability('chanceTobt', config.transitionConfig.chanceTobt);
    this.validateProbability('btToSuperBigBonus', config.transitionConfig.btToSuperBigBonus);
  }

  private validateProbability(name: string, value: number): void {
    if (value < 0 || value > 1) {
      throw new Error(
        `Invalid probability for ${name}: ${value}. Must be between 0 and 1.`
      );
    }
  }
}
