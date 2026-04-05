import React from 'react';

/** シンボル定義 */
interface SymbolDefinition<S extends string = string> {
    id: S;
    name: string;
    weight: number;
}
/** リール設定 */
interface ReelConfig<S extends string = string> {
    symbols: SymbolDefinition<S>[];
    reelStrip: ReelStrip<S>;
}
/** ReelStrip: 循環リスト */
type ReelStrip<S extends string = string> = S[];

/** GameMode: ゲームモード列挙型 */
type GameMode = 'Normal' | 'Chance' | 'Bonus' | 'BT';
/** BonusType: ボーナス種別 */
type BonusType = 'SUPER_BIG_BONUS' | 'BIG_BONUS' | 'REG_BONUS';
/** WinningRoleType: 当選役種別 */
type WinningRoleType = 'BONUS' | 'SMALL_WIN' | 'REPLAY' | 'MISS';
/** WinningRole: 当選役 */
interface WinningRole {
    id: string;
    name: string;
    type: WinningRoleType;
    bonusType?: BonusType;
    payout: number;
    patterns: string[][];
    priority: number;
}
/** WinningRoleDefinition: 小役定義 */
interface WinningRoleDefinition {
    id: string;
    name: string;
    type: WinningRoleType;
    payout: number;
    patterns: string[][];
    priority: number;
}
/** CarryOverFlag: 持ち越しフラグ */
interface CarryOverFlag {
    winningRole: WinningRole;
    gameCount: number;
}
/** ModeTransitionConfig: モード遷移確率設定 */
interface ModeTransitionConfig {
    normalToChance: number;
    chanceTobt: number;
    btToSuperBigBonus: number;
}
/** BonusConfig: ボーナス設定 */
interface BonusConfig {
    type: BonusType;
    payoutMultiplier: number;
    maxSpins: number;
    maxPayout: number;
}
/** BTConfig: BTモード設定 */
interface BTConfig {
    maxSpins: number;
    maxPayout: number;
    winPatterns: WinPattern[];
}
/** ChanceConfig: チャンスモード設定 */
interface ChanceConfig {
    maxSpins: number;
    maxPayout: number;
    winPatterns: WinPattern[];
}
/** WinPattern: モード遷移トリガーパターン */
interface WinPattern {
    symbols: string[];
    positions?: number[];
}

/** Payline: 当選判定ライン */
interface Payline {
    /** ライン番号 */
    index: number;
    /** 各リールの行位置（例: [0,0,0]で上段横一列） */
    positions: number[];
}
/** PayTable: 配当表 */
interface PayTable<S extends string = string> {
    entries: PayTableEntry<S>[];
}
/** PayTableEntry: 配当表エントリ */
interface PayTableEntry<S extends string = string> {
    /** シンボルの組み合わせパターン */
    pattern: S[];
    /** 配当額 */
    payout: number;
    /** 当選役種別 */
    roleType: WinningRoleType;
}

/** SlipRange: 引き込み範囲 */
type SlipRange = number;
/** StopTiming: プレイヤーの停止タイミング */
type StopTiming = number;
/** StopResult: 停止結果 */
interface StopResult {
    reelIndex: number;
    targetPosition: number;
    actualPosition: number;
    slipCount: number;
    isMiss: boolean;
}
/** PaylineResult: 当選ライン結果 */
interface PaylineResult<S extends string = string> {
    lineIndex: number;
    matchedSymbols: S[];
    payout: number;
    payline: Payline;
}
/** SpinResult: 1回のスピン結果 */
interface SpinResult<S extends string = string> {
    /** 各リールの停止シンボル（grid[row][reel]） */
    grid: S[][];
    /** 各リールの停止結果 */
    stopResults: StopResult[];
    /** 当選ライン情報 */
    winLines: PaylineResult<S>[];
    /** 合計配当 */
    totalPayout: number;
    /** リプレイ当選フラグ */
    isReplay: boolean;
    /** 取りこぼしフラグ */
    isMiss: boolean;
    /** 取りこぼした当選役情報 */
    missedRole?: WinningRole;
    /** 内部当選役 */
    winningRole: WinningRole;
}

/** GamePhase: ゲームサイクルフェーズ */
type GamePhase = 'BET' | 'LEVER_ON' | 'INTERNAL_LOTTERY' | 'NOTIFICATION_CHECK' | 'REEL_SPINNING' | 'STOP_OPERATION' | 'REEL_STOPPED' | 'RESULT_CONFIRMED' | 'WIN_JUDGE' | 'PAYOUT' | 'MODE_TRANSITION' | 'ZONE_UPDATE' | 'COUNTER_UPDATE' | 'WAITING';
/** Replay: リプレイ（WinningRoleType: REPLAYとして定義） */
type Replay = WinningRole & {
    type: 'REPLAY';
};

/** NotificationType: 告知タイミング */
type NotificationType = 'PRE_SPIN' | 'POST_SPIN' | 'NEXT_BET' | 'LEVER_ON';
/** NotificationPayload: 告知ペイロード */
interface NotificationPayload {
    type: NotificationType;
    winningRole: WinningRole;
    spinResult?: SpinResult;
    timestamp: number;
}
/** NotificationConfig: 告知設定 */
interface NotificationConfig {
    enabledTypes: Partial<Record<NotificationType, boolean>>;
    targetRoleTypes: WinningRoleType[];
    onNotification?: (payload: NotificationPayload) => void;
    callbacks?: Partial<Record<NotificationType, (payload: NotificationPayload) => void>>;
}

/** GameZone: ゲームゾーン識別子 */
type GameZone = string;
/** ZoneConfig: ゾーン設定 */
interface ZoneConfig {
    name: string;
    maxGames: number;
    maxNetCredits: number;
    resetTargets: ('gameMode' | 'spinCounter')[];
    nextZone: string;
    isSpecial: boolean;
}
/** ZoneState: ゾーン状態 */
interface ZoneState {
    currentZone: GameZone;
    gamesPlayed: number;
    netCredits: number;
}
/** ZoneIndicator: ゾーンインジケーター */
interface ZoneIndicator {
    isSpecialZone: boolean;
    zoneName: string;
}

/** BetConfig: BET設定 */
interface BetConfig {
    initialCredit: number;
    betOptions: number[];
    defaultBet: number;
    historySize?: number;
}
/** CreditHistory: クレジット変動履歴 */
interface CreditHistory {
    type: 'BET' | 'PAYOUT' | 'DEPOSIT' | 'WITHDRAW';
    amount: number;
    balanceAfter: number;
    timestamp: number;
}
/** CreditState: クレジット状態 */
interface CreditState {
    balance: number;
    currentBet: number;
    history: CreditHistory[];
}

/** ThresholdRange: 閾値範囲（振り分け天井） */
interface ThresholdRange {
    min: number;
    max: number;
}
/** ThresholdConfig: 閾値トリガー設定 */
interface ThresholdConfig {
    counterName: string;
    targetGameMode: GameMode;
    threshold: number | ThresholdRange;
    action: string;
    resetCondition: string;
}

/** DifficultyConfig: 設定段階パラメータ */
interface DifficultyConfig {
    level: number;
    lotteryProbabilities: Record<string, number>;
    transitionProbabilities: Partial<ModeTransitionConfig>;
    replayProbability: number;
}
/** DifficultyPresetConfig: 設定段階プリセット設定 */
interface DifficultyPresetConfig {
    levels: Record<number, DifficultyConfig>;
    initialLevel: number;
}

/** AnimationConfig: アニメーション設定 */
interface AnimationConfig {
    /** 回転速度（px/ms） */
    spinSpeed?: number;
    /** イージング関数 */
    easing?: string;
    /** 各リールの停止遅延（ms） */
    stopDelays?: number[];
    /** 加速時間（ms） */
    accelerationDuration?: number;
    /** 減速時間（ms） */
    decelerationDuration?: number;
}

/** GameEvent: 標準イベント型 */
type GameEvent = 'spinStart' | 'reelStop' | 'win' | 'bonusStart' | 'modeChange' | 'zoneChange' | 'phaseChange' | 'creditChange' | 'notification';

/** GameConfig: ゲーム全体設定（シリアライズ対象） */
interface GameConfig<S extends string = string> {
    reelConfigs: ReelConfig<S>[];
    payTable: PayTable<S>;
    paylines: Payline[];
    modeTransitionConfig: ModeTransitionConfig;
    bonusConfigs: Record<BonusType, BonusConfig>;
    btConfig: BTConfig;
    chanceConfig: ChanceConfig;
    notificationConfig: NotificationConfig;
    zoneConfigs: Record<string, ZoneConfig>;
    betConfig: BetConfig;
    thresholdConfigs: ThresholdConfig[];
    difficultyConfigs: Record<number, DifficultyConfig>;
    winningRoleDefinitions: WinningRoleDefinition[];
}

/** SlotMachineProps: メインコンテナコンポーネントのprops */
interface SlotMachineProps<S extends string = string> {
    /** リール数（デフォルト: 3） */
    reelCount?: number;
    /** 行数（デフォルト: 3） */
    rowCount?: number;
    /** シンボル定義 */
    symbols: SymbolDefinition<S>[];
    /** シンボルのカスタムレンダリング関数 */
    renderSymbol?: (symbolId: S) => React.ReactNode;
    /** アニメーション設定 */
    animationConfig?: AnimationConfig;
    /** ストップボタン表示（デフォルト: true） */
    showStopButtons?: boolean;
    /** カスタムレイアウト */
    children?: React.ReactNode;
    /** CSSクラス名 */
    className?: string;
    /** インラインスタイル */
    style?: React.CSSProperties;
}
/** SlotMachine: メインコンテナコンポーネント */
declare function SlotMachine<S extends string = string>({ reelCount, rowCount, symbols, renderSymbol, animationConfig, showStopButtons, children, className, style, }: SlotMachineProps<S>): React.ReactElement;

/** ReelProps: 個別リールコンポーネントのprops */
interface ReelProps<S extends string = string> {
    /** シンボルリスト */
    symbols: S[];
    /** スピン状態 */
    spinning: boolean;
    /** 停止位置インデックス */
    stopPosition?: number;
    /** シンボルのカスタムレンダリング関数 */
    renderSymbol?: (symbolId: S) => React.ReactNode;
    /** 表示行数 */
    rowCount?: number;
    /** CSSクラス名 */
    className?: string;
    /** インラインスタイル */
    style?: React.CSSProperties;
}
/** Reel: 個別リールコンポーネント */
declare function Reel<S extends string = string>({ symbols, spinning, stopPosition, renderSymbol, rowCount, className, style, }: ReelProps<S>): React.ReactElement;

/** SymbolProps: 個別シンボルコンポーネントのprops */
interface SymbolProps<S extends string = string> {
    /** シンボルID */
    symbolId: S;
    /** カスタムレンダリング関数 */
    renderSymbol?: (symbolId: S) => React.ReactNode;
    /** 当選ラインに含まれているか */
    highlighted?: boolean;
    /** CSSクラス名 */
    className?: string;
}
/** Symbol: 個別シンボルコンポーネント */
declare function Symbol<S extends string = string>({ symbolId, renderSymbol, highlighted, className, }: SymbolProps<S>): React.ReactElement;

/** StopButtonProps: ストップボタンコンポーネントのprops */
interface StopButtonProps {
    /** 対応するリールインデックス */
    reelIndex: number;
    /** ボタン有効/無効 */
    disabled?: boolean;
    /** 押下時コールバック */
    onStop: (reelIndex: number, timing: StopTiming) => void;
    /** CSSクラス名 */
    className?: string;
    /** インラインスタイル */
    style?: React.CSSProperties;
    /** アクセシビリティラベル */
    'aria-label'?: string;
}
/** StopButton: 各リールに対応するストップボタン */
declare function StopButton({ reelIndex, disabled, onStop, className, style, 'aria-label': ariaLabel, }: StopButtonProps): React.ReactElement;

/**
 * InternalLotteryConfig: 内部抽選モジュールの設定
 */
interface InternalLotteryConfig {
    /** GameMode別・WinningRoleType別の当選確率 */
    probabilities: Record<GameMode, Record<string, number>>;
    /** 小役定義 */
    winningRoleDefinitions: WinningRoleDefinition[];
    /** カスタム乱数生成関数 */
    randomFn?: () => number;
}
/**
 * InternalLottery: 内部抽選モジュール
 *
 * レバーON時に当選役（WinningRole）を決定する。
 * GameMode・DifficultyPreset に応じた確率抽選、CarryOverFlag 管理、
 * カスタム小役定義のバリデーションを提供する。
 */
declare class InternalLottery {
    private readonly probabilities;
    private readonly roleDefinitions;
    private readonly roleMap;
    private readonly randomFn;
    private carryOver;
    constructor(config: InternalLotteryConfig);
    /**
     * 内部抽選を実行し、WinningRole を返却する
     *
     * @param gameMode - 現在のゲームモード
     * @param difficultyLevel - 設定段階（オプション、将来の DifficultyPreset 連携用）
     * @returns 当選役
     */
    draw(gameMode: GameMode, _difficultyLevel?: number): WinningRole;
    /**
     * CarryOverFlag を設定する
     */
    setCarryOver(winningRole: WinningRole): void;
    /**
     * 現在の CarryOverFlag を取得する
     */
    getCarryOverFlag(): CarryOverFlag | null;
    /**
     * CarryOverFlag をクリアする
     */
    clearCarryOver(): void;
    /**
     * BONUS 種別を解決する
     */
    private resolveBonusType;
    /**
     * roleId を WinningRoleType として解釈し、WinningRole を生成する
     */
    private resolveByType;
    /**
     * 小役定義のバリデーション
     */
    private validateDefinitions;
    /**
     * 確率設定のバリデーション
     */
    private validateProbabilities;
}

/**
 * ReelControllerConfig: 出目制御モジュールの設定
 */
interface ReelControllerConfig<S extends string = string> {
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
 * ReelController: 出目制御モジュール
 *
 * InternalLotteryの当選役に基づいて各リールの停止位置を制御する。
 * 引き込み（Slip）・蹴飛ばし（Reject）処理、AutoStop、取りこぼし判定を提供する。
 */
declare class ReelController<S extends string = string> {
    private readonly reelStrips;
    private readonly slipRanges;
    private readonly autoStop;
    private readonly stopOrder;
    private readonly carryOverEnabled;
    private readonly randomFn;
    private readonly stopCallbacks;
    constructor(config: ReelControllerConfig<S>);
    /**
     * 停止位置決定
     *
     * 当選役のパターンに基づいて引き込み（Slip）・蹴飛ばし（Reject）を適用し、
     * 最終停止位置を決定する。
     */
    determineStopPosition(reelIndex: number, winningRole: WinningRole, stopTiming: StopTiming): StopResult;
    /**
     * AutoStop実行 — 全リールをランダムタイミングで停止
     */
    autoStopAll(winningRole: WinningRole): StopResult[];
    /**
     * 停止コールバック登録
     */
    onStop(callback: (result: StopResult) => void): void;
    /**
     * AutoStopモードかどうかを返す
     */
    get isAutoStop(): boolean;
    /**
     * 持ち越し設定が有効かどうかを返す
     */
    get isCarryOverEnabled(): boolean;
    /**
     * 停止順序を返す
     */
    getStopOrder(): number[];
    /**
     * 指定リールのReelStripを返す
     */
    getReelStrip(reelIndex: number): ReelStrip<S>;
    /**
     * 当選役パターンからリール別のターゲットシンボルを取得
     */
    private getTargetSymbols;
    /**
     * 引き込み（Slip）を試行する
     *
     * stopTimingからSlipRange以内にターゲットシンボルがあれば、
     * その位置と引き込みコマ数を返す。なければnull。
     */
    private trySlip;
    /**
     * 蹴飛ばし（Reject）を適用する
     *
     * 非当選役のシンボルが表示されないように停止位置をずらす。
     * stopTimingからSlipRange以内で、ターゲットシンボルでない位置を探す。
     */
    private applyReject;
    /**
     * 循環距離を計算する
     */
    private circularDistance;
    /**
     * 停止コールバックを通知する
     */
    private notifyStop;
    /**
     * 設定のバリデーション
     */
    private validateConfig;
}

/**
 * SpinEngineConfig: SpinEngine ファサードの設定
 */
interface SpinEngineConfig<S extends string = string> {
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
/**
 * SpinEngine: InternalLottery → ReelController → Payline評価を統合するファサード
 *
 * 開発者は SpinEngine を直接使用するか、個別モジュール（InternalLottery、ReelController）を
 * 個別に使用するかを選択可能。
 */
declare class SpinEngine<S extends string = string> {
    private readonly reelConfigs;
    private readonly payTable;
    private readonly paylines;
    private readonly randomFn;
    private readonly internalLottery;
    private readonly reelController;
    /** デフォルトの行数（3行） */
    private readonly rowCount;
    constructor(config: SpinEngineConfig<S>);
    /**
     * 統合スピン実行
     *
     * winningRole が渡された場合は ReelController で出目制御を行い、
     * 渡されていない場合は重み付けランダム抽選にフォールバックする。
     */
    spin(winningRole?: WinningRole, stopTimings?: StopTiming[]): SpinResult<S>;
    /**
     * InternalLottery のみ実行
     */
    lottery(gameMode: GameMode, difficulty?: number): WinningRole;
    /**
     * ReelController のみ実行
     */
    controlReels(winningRole: WinningRole, stopTimings?: StopTiming[]): StopResult[];
    /**
     * Payline 評価のみ実行
     *
     * 横・斜め・V字等のカスタムパターンに対応。
     * 複数 Payline 同時当選時は全配当を返却する。
     */
    evaluatePaylines(grid: S[][]): PaylineResult<S>[];
    /**
     * PayTable からシンボル配列にマッチするエントリを検索
     */
    private findPayTableMatch;
    /**
     * シンボル配列がパターンにマッチするか判定
     * パターン内の 'ANY' はワイルドカードとして扱う
     */
    private matchesPattern;
    /**
     * ランダムフォールバック: 重み付け抽選で各リールの停止位置を決定
     */
    private randomStopResults;
    /**
     * 重み付けランダムでシンボルを選択し、ReelStrip 上の位置を返す
     */
    private weightedRandomPosition;
    /**
     * ランダムな StopTiming を生成
     */
    private generateRandomTimings;
    /**
     * グリッド生成: stopResults から grid[row][reel] を構築
     *
     * 各リールの actualPosition を中心に rowCount 行分のシンボルを取得する。
     */
    private buildGrid;
    /**
     * ReelConfig のバリデーション
     */
    private validateReelConfigs;
}

/**
 * CreditManager: クレジット残高管理モジュール
 *
 * BET消費・Payout加算・投入/引き出し操作を一元管理し、
 * 残高不足時のスピン拒否やBET額バリエーションの設定を行う。
 */
declare class CreditManager {
    private _balance;
    private _currentBet;
    private readonly betOptions;
    private readonly historySize;
    private readonly _history;
    constructor(config: BetConfig);
    /** 現在の残高 */
    get balance(): number;
    /** 現在のBET額 */
    get currentBet(): number;
    /**
     * BET消費: 現在のBET額をクレジット残高から減算する
     * @returns BET成功時 true、クレジット不足時 false
     */
    bet(): boolean;
    /**
     * Payout加算: 配当額をクレジット残高に加算する
     * @param amount 配当額
     */
    payout(amount: number): void;
    /**
     * クレジット投入: クレジットを追加する
     * @param amount 投入額
     */
    deposit(amount: number): void;
    /**
     * クレジット引き出し: クレジットを引き出す
     * @param amount 引き出し額
     * @returns 引き出し成功時 true、残高不足時 false
     */
    withdraw(amount: number): boolean;
    /**
     * BET額変更
     * @param amount 新しいBET額（betOptionsに含まれている必要がある）
     */
    setBet(amount: number): void;
    /**
     * 変動履歴取得
     * @param count 取得件数（省略時は全件）
     * @returns 直近の変動履歴（新しい順）
     */
    getHistory(count?: number): CreditHistory[];
    /**
     * 現在のクレジット状態を取得
     */
    getState(): CreditState;
    /**
     * 履歴エントリを追加（直近N件を保持）
     */
    private addHistory;
    /**
     * BetConfig のバリデーション
     */
    private validateConfig;
}

/**
 * モジュール間のイベント伝達を担うイベントバス。
 *
 * - 同一イベントへの複数リスナー登録
 * - ペイロードデータ渡し
 * - 未購読イベントの無視（エラーなし）
 * - `on` は購読解除関数を返す
 */
declare class EventEmitter {
    private listeners;
    /**
     * イベントを発火し、登録済みの全リスナーにペイロードを配信する。
     * 購読者がいない場合は何もしない。
     */
    emit<T = unknown>(event: string, payload?: T): void;
    /**
     * イベントを購読する。
     * @returns 購読解除関数
     */
    on<T = unknown>(event: string, listener: (payload: T) => void): () => void;
    /**
     * イベントの購読を解除する。
     */
    off(event: string, listener: Function): void;
}

/** GameModeManagerConfig: GameModeManager の設定 */
interface GameModeManagerConfig {
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
/**
 * GameModeManager: ゲームモードの状態遷移を管理するステートマシン
 *
 * Normal, Chance, Bonus, BT の4種類のモードを管理し、
 * スピン結果と当選役に基づいてモード遷移を判定する。
 */
declare class GameModeManager {
    private _currentMode;
    private _currentBonusType;
    private _modeChangeCallbacks;
    private _modeState;
    private readonly transitionConfig;
    private readonly bonusConfigs;
    private readonly btConfig;
    private readonly chanceConfig;
    private readonly randomFn;
    constructor(config: GameModeManagerConfig);
    /** 現在のGameMode */
    get currentMode(): GameMode;
    /** 現在のBonusType（BonusMode時のみ） */
    get currentBonusType(): BonusType | null;
    /**
     * 残りスピン数を取得する
     * @returns 残りスピン数。NormalMode時はnull
     */
    getRemainingSpins(): number | null;
    /**
     * 累計獲得配当を取得する
     * @returns 現在モードでの累計配当
     */
    getAccumulatedPayout(): number;
    /**
     * モード遷移コールバックを登録する
     * @param callback 遷移元モードと遷移先モードを受け取るコールバック
     */
    onModeChange(callback: (from: GameMode, to: GameMode) => void): void;
    /**
     * スピン結果と当選役に基づいてモード遷移を判定する
     * @param spinResult スピン結果
     * @param winningRole 内部当選役
     * @returns 遷移後のGameMode
     */
    evaluateTransition(spinResult: SpinResult, winningRole: WinningRole): GameMode;
    /**
     * モードに応じた SpinEngine パラメータ情報を返す
     * @returns 現在のモードに対応するパラメータキー
     */
    getSpinEngineParams(): {
        mode: GameMode;
        bonusType: BonusType | null;
    };
    private evaluateNormalTransition;
    private evaluateChanceTransition;
    private evaluateBonusTransition;
    private evaluateBTTransition;
    private endBonus;
    private transitionToBonus;
    private transitionTo;
    private initModeState;
    private resetModeState;
    private matchesWinPattern;
    private matchesSinglePattern;
    private validateTransition;
    private validateConfig;
    private validateProbability;
}

/**
 * NotificationManager: 告知タイミング判定・イベント発火モジュール
 *
 * InternalLottery の WinningRole 結果に基づき、設定された告知タイミングで
 * onNotification コールバックを発火する。演出（UI/アニメーション/サウンド）は
 * 提供せず、ロジックとイベント発火のみを担当する。
 */
declare class NotificationManager {
    private readonly enabledTypes;
    private readonly targetRoleTypes;
    private readonly onNotificationCallback?;
    private previousWin;
    constructor(config: NotificationConfig);
    /**
     * 告知判定実行
     *
     * 指定されたタイミングで告知条件を評価し、条件を満たす場合に
     * onNotification コールバックを発火する。
     *
     * @param timing 告知タイミング
     * @param winningRole 当選役（PRE_SPIN, POST_SPIN, LEVER_ON で使用）
     * @param spinResult スピン結果（POST_SPIN で使用）
     */
    check(timing: NotificationType, winningRole?: WinningRole, spinResult?: SpinResult): void;
    /**
     * 前ゲーム当選情報を保持する（NEXT_BET 告知用）
     * @param winningRole 前ゲームの当選役
     */
    setPreviousWin(winningRole: WinningRole): void;
    /**
     * 前ゲーム当選情報をクリアする
     */
    clearPreviousWin(): void;
    /**
     * PRE_SPIN / LEVER_ON 告知処理
     */
    private handleCurrentGameNotification;
    /**
     * POST_SPIN 告知処理
     */
    private handlePostSpinNotification;
    /**
     * NEXT_BET 告知処理: 前ゲーム当選情報に基づき告知し、発火後にクリアする
     */
    private handleNextBetNotification;
    /**
     * 当選役が告知対象かどうかを判定する
     */
    private isTargetRole;
    /**
     * onNotification コールバックを発火する
     */
    private fireNotification;
    /**
     * NotificationConfig のバリデーション
     */
    private validateConfig;
}

/** ZoneManagerConfig: ゾーンマネージャー設定 */
interface ZoneManagerConfig {
    zones: Record<string, ZoneConfig>;
    initialZone: string;
}
/**
 * ZoneManager: ゲームゾーン管理モジュール
 *
 * 複数のGameZone（通常区間、特別区間等）を管理し、
 * ゲーム数上限・差枚数上限の監視とゾーン終了時の強制リセットを担当する。
 */
declare class ZoneManager {
    private readonly zones;
    private _state;
    private _onZoneChangeCallbacks;
    private _resetCallbacks;
    constructor(config: ZoneManagerConfig);
    /** 現在のZoneState */
    get currentState(): ZoneState;
    /** ZoneIndicator */
    get indicator(): ZoneIndicator;
    /**
     * ゾーン更新: SpinResult に基づいてゲーム数・差枚数を更新し、ゾーン終了判定を行う
     */
    update(spinResult: SpinResult): void;
    /**
     * ゾーン遷移コールバック登録
     */
    onZoneChange(callback: (from: string, to: string) => void): void;
    /**
     * リセットコールバック登録（GameCycleManager等が利用）
     */
    onReset(callback: (targets: ('gameMode' | 'spinCounter')[]) => void): void;
    /**
     * ゾーン遷移処理
     */
    private transitionTo;
    /**
     * 設定バリデーション
     */
    private validateConfig;
}

/** Counter configuration for SpinCounter */
interface CounterConfig {
    /** Counter name */
    name: string;
    /** Target GameMode for counting */
    targetGameMode: GameMode;
    /** Condition string that triggers counter reset (e.g., 'BonusMode') */
    resetCondition: string;
}
/**
 * SpinCounter manages multiple spin counters simultaneously.
 * Each counter tracks spins for a specific GameMode and can be reset
 * when certain conditions are met (e.g., BonusMode win).
 */
declare class SpinCounter {
    private counters;
    private configs;
    constructor(configs?: CounterConfig[]);
    /** Get counter value by name. Returns 0 for unknown counters. */
    get(name: string): number;
    /** Increment counter by name. Creates counter if it doesn't exist. */
    increment(name: string): void;
    /** Reset counter to 0 by name. */
    reset(name: string): void;
    /** Get all counters as a record. */
    getAll(): Record<string, number>;
    /** Get the config for a specific counter. */
    getConfig(name: string): CounterConfig | undefined;
    /** Check if a reset condition matches any counter and reset those counters. */
    checkResetCondition(condition: string): string[];
}

/**
 * GameCycleManagerConfig: 依存モジュールを注入する設定オブジェクト
 * 各モジュールはオプショナル — 未提供時はスキップされる
 */
interface GameCycleManagerConfig {
    spinEngine?: SpinEngine;
    creditManager?: CreditManager;
    gameModeManager?: GameModeManager;
    notificationManager?: NotificationManager;
    zoneManager?: ZoneManager;
    spinCounter?: SpinCounter;
    eventEmitter?: EventEmitter;
    internalLottery?: InternalLottery;
}
/**
 * GameCycleManager: 1ゲームのライフサイクルを統合管理するオーケストレーター
 *
 * BET→LEVER_ON→INTERNAL_LOTTERY→NOTIFICATION_CHECK→REEL_SPINNING→
 * STOP_OPERATION→REEL_STOPPED→RESULT_CONFIRMED→WIN_JUDGE→PAYOUT→
 * MODE_TRANSITION→ZONE_UPDATE→COUNTER_UPDATE→WAITING の14フェーズを順序管理し、
 * 各フェーズで対応するモジュールを呼び出す。
 */
declare class GameCycleManager {
    private _currentPhase;
    private _phaseChangeCallbacks;
    private _isReplay;
    private _currentWinningRole;
    private _currentSpinResult;
    private _stopTimings;
    private readonly spinEngine?;
    private readonly creditManager?;
    private readonly gameModeManager?;
    private readonly notificationManager?;
    private readonly zoneManager?;
    private readonly spinCounter?;
    private readonly eventEmitter?;
    private readonly internalLottery?;
    constructor(config: GameCycleManagerConfig);
    /** 現在のGamePhase */
    get currentPhase(): GamePhase;
    /** 現在のスピンがリプレイかどうか */
    get isReplay(): boolean;
    /**
     * ゲームサイクル開始
     * リプレイ時はBETをスキップしてLEVER_ONから開始する
     */
    startCycle(): void;
    /**
     * フェーズ遷移コールバック登録
     */
    onPhaseChange(callback: (from: GamePhase, to: GamePhase) => void): void;
    /**
     * ストップ操作通知
     */
    notifyStop(reelIndex: number, timing: StopTiming): void;
    /**
     * 次のフェーズへ進む
     */
    advancePhase(): void;
    /**
     * フェーズ遷移を実行し、対応するモジュールを呼び出す
     */
    private transitionTo;
    /**
     * 各フェーズに対応するモジュール呼び出し
     */
    private executePhase;
    /** BETフェーズ: CreditManager.bet() */
    private executeBet;
    /** INTERNAL_LOTTERYフェーズ: InternalLottery.draw() */
    private executeInternalLottery;
    /** NOTIFICATION_CHECKフェーズ: NotificationManager.check() */
    private executeNotificationCheck;
    /** REEL_SPINNINGフェーズ: SpinEngine でスピン開始 */
    private executeReelSpinning;
    /** WIN_JUDGEフェーズ: Payline評価（SpinResult内で既に評価済み） */
    private executeWinJudge;
    /** PAYOUTフェーズ: CreditManager.payout() */
    private executePayout;
    /** MODE_TRANSITIONフェーズ: GameModeManager.evaluateTransition() */
    private executeModeTransition;
    /** ZONE_UPDATEフェーズ: ZoneManager.update() */
    private executeZoneUpdate;
    /** COUNTER_UPDATEフェーズ: SpinCounter.increment() */
    private executeCounterUpdate;
    /** WAITINGフェーズ: リプレイ判定 */
    private executeWaiting;
}

type SpinState = 'idle' | 'spinning' | 'stopped';
interface UseSlotMachineConfig<S extends string = string> {
    spinEngine: SpinEngineConfig<S>;
    credit?: BetConfig;
    gameCycle?: GameCycleManagerConfig;
}
/**
 * useSlotMachine: メインフック。スピン状態・フェーズ・結果のリアクティブ管理を提供する。
 */
declare function useSlotMachine<S extends string = string>(config: UseSlotMachineConfig<S>): {
    spinState: SpinState;
    currentPhase: GamePhase;
    spinResult: SpinResult<S> | null;
    spin: () => void;
    reset: () => void;
    _engine: SpinEngine<S>;
    _credit: CreditManager | null;
    _cycle: GameCycleManager | null;
};

/**
 * useGameMode: GameModeManager をラップし、モード遷移のリアクティブ状態を提供する。
 */
declare function useGameMode(config: GameModeManagerConfig): {
    currentMode: GameMode;
    currentBonusType: BonusType | null;
    remainingSpins: number | null;
    evaluateTransition: (spinResult: SpinResult, winningRole: WinningRole) => void;
    _manager: GameModeManager;
};

/**
 * useGameCycle: GameCycleManager をラップし、ゲームサイクルのリアクティブ状態を提供する。
 */
declare function useGameCycle(config: GameCycleManagerConfig): {
    currentPhase: GamePhase;
    isReplay: boolean;
    startCycle: () => void;
    onPhase: (phase: GamePhase, callback: () => void) => void;
    _manager: GameCycleManager;
};

/**
 * useGameZone: ZoneManager をラップし、ゾーン管理のリアクティブ状態を提供する。
 */
declare function useGameZone(config: ZoneManagerConfig): {
    currentZone: string;
    gamesPlayed: number;
    netCredits: number;
    indicator: ZoneIndicator;
    remainingGames: number;
    remainingCredits: number;
    update: (spinResult: SpinResult) => void;
    _manager: ZoneManager;
};

/**
 * useCredit: CreditManager をラップし、クレジット管理のリアクティブ状態を提供する。
 */
declare function useCredit(config: BetConfig): {
    balance: number;
    currentBet: number;
    betOptions: number[];
    canSpin: boolean;
    history: CreditHistory[];
    setBet: (amount: number) => void;
    deposit: (amount: number) => void;
    withdraw: (amount: number) => void;
    /** Expose manager for integration with other hooks */
    _manager: CreditManager;
    /** Sync state after external manager mutations */
    _sync: () => void;
};

type NotificationStatus = 'pending' | 'notified' | 'idle';
/**
 * useNotification: NotificationManager をラップし、告知状態のリアクティブ管理を提供する。
 */
declare function useNotification(config: NotificationConfig): {
    status: NotificationStatus;
    lastPayload: NotificationPayload | null;
    acknowledgeNotification: () => void;
    onPreSpin: (cb: (payload: NotificationPayload) => void) => void;
    onPostSpin: (cb: (payload: NotificationPayload) => void) => void;
    onNextBet: (cb: (payload: NotificationPayload) => void) => void;
    onLeverOn: (cb: (payload: NotificationPayload) => void) => void;
    _manager: NotificationManager;
};

/**
 * useSoundEffect: EventEmitter からのイベント購読と対応サウンドの自動再生を管理する。
 * ミュート切り替え・音量調整機能を提供する。
 */
declare function useSoundEffect(soundMap: Record<string, string>, emitter?: EventEmitter): {
    soundMap: Record<string, string>;
    isMuted: boolean;
    volume: number;
    toggleMute: () => void;
    setVolume: (v: number) => void;
};

/** Callback type for threshold reached events */
type ThresholdReachedCallback = (counterName: string, value: number, action: string) => void;
/**
 * ThresholdTrigger monitors SpinCounter values against configured thresholds.
 * When a counter reaches its threshold, the specified action is triggered
 * and the onThresholdReached callback is invoked.
 *
 * Supports both fixed thresholds and ThresholdRange (random threshold within min/max).
 * When ThresholdRange is used, the threshold is re-rolled on counter reset.
 */
declare class ThresholdTrigger {
    private configs;
    private resolvedThresholds;
    private callbacks;
    private randomFn;
    constructor(configs?: ThresholdConfig[], randomFn?: () => number);
    /**
     * Check if a counter value has reached its threshold.
     * If threshold is reached, invokes callbacks and returns true.
     */
    check(counterName: string, value: number): boolean;
    /** Register a callback for threshold reached events. */
    onThresholdReached(callback: ThresholdReachedCallback): void;
    /**
     * Re-roll the threshold for a counter (used when ThresholdRange is configured).
     * For fixed thresholds, this is a no-op (threshold stays the same).
     */
    reroll(counterName: string): void;
    /** Get the current resolved threshold for a counter. */
    getThreshold(counterName: string): number | undefined;
    /** Get all resolved thresholds as a record. */
    getAllThresholds(): Record<string, number>;
}

/**
 * useThresholdTrigger: SpinCounter / ThresholdTrigger をラップし、
 * カウンターと閾値のリアクティブ状態を提供する。
 */
declare function useThresholdTrigger(configs: ThresholdConfig[]): {
    counters: Record<string, number>;
    thresholds: Record<string, number>;
    resetCounter: (name: string) => void;
    _counter: SpinCounter;
    _trigger: ThresholdTrigger;
    /** Sync state after external mutations */
    _sync: () => void;
};

/**
 * DifficultyPreset: ゲーム全体の難易度を段階的に管理する。
 * 設定段階を切り替えることで、内部抽選確率・モード遷移確率・リプレイ確率を一括変更する。
 */
declare class DifficultyPreset {
    private _currentLevel;
    private readonly levels;
    constructor(config: DifficultyPresetConfig);
    /** 現在の設定段階 */
    get currentLevel(): number;
    /** 現在のDifficultyConfig */
    get currentConfig(): DifficultyConfig;
    /** 設定段階変更 */
    setDifficulty(level: number): void;
    /** 利用可能な設定段階一覧 */
    getAvailableLevels(): number[];
    private validateConfig;
    private validateDifficultyConfig;
}

/**
 * useDifficulty: DifficultyPreset をラップし、設定段階のリアクティブ管理を提供する。
 */
declare function useDifficulty(config: DifficultyPresetConfig): {
    currentLevel: number;
    currentConfig: DifficultyConfig;
    setDifficulty: (level: number) => void;
    _preset: DifficultyPreset;
};

/**
 * useEvent: EventEmitter のイベント購読・発火を React コンポーネント内で管理する。
 * コンポーネントアンマウント時に自動購読解除を行う。
 */
declare function useEvent(emitter: EventEmitter): {
    emit: <T = unknown>(event: string, payload?: T) => void;
    on: <T = unknown>(event: string, listener: (payload: T) => void) => void;
};

/** Animation phase */
type AnimationPhase = 'idle' | 'accelerating' | 'spinning' | 'decelerating';
/** AnimationController: 3-phase animation control for reel spinning */
declare class AnimationController {
    private config;
    private phase;
    private spinCompleteCallbacks;
    private reelCount;
    private stoppedReels;
    constructor(config?: AnimationConfig, reelCount?: number);
    /** Get current animation phase */
    getPhase(): AnimationPhase;
    /** Get resolved config */
    getConfig(): Required<AnimationConfig>;
    /** Start spin animation (acceleration → constant speed) */
    startSpin(): void;
    /** Stop a specific reel with deceleration */
    stopReel(reelIndex: number, _position: number): Promise<void>;
    /** Register spin complete callback */
    onSpinComplete(callback: () => void): void;
    /** Remove spin complete callback */
    offSpinComplete(callback: () => void): void;
    private notifySpinComplete;
}

/**
 * GameConfig のシリアライズ・デシリアライズ・バリデーションを提供するユーティリティ
 */
declare const ConfigSerializer: {
    /**
     * GameConfig を JSON 文字列にシリアライズする
     */
    serialize(config: GameConfig): string;
    /**
     * JSON 文字列を GameConfig にデシリアライズする
     *
     * @throws 不正な JSON の場合はパースエラー
     * @throws 必須フィールド欠落の場合はバリデーションエラー
     */
    deserialize(json: string): GameConfig;
    /**
     * 値が有効な GameConfig かどうかを検証する型ガード
     */
    validate(config: unknown): config is GameConfig;
};

export { type AnimationConfig, AnimationController, type AnimationPhase, type BTConfig, type BetConfig, type BonusConfig, type BonusType, type CarryOverFlag, type ChanceConfig, ConfigSerializer, type CreditHistory, CreditManager, type CreditState, type DifficultyConfig, DifficultyPreset, type DifficultyPresetConfig, EventEmitter, type GameConfig, GameCycleManager, type GameCycleManagerConfig, type GameEvent, type GameMode, GameModeManager, type GameModeManagerConfig, type GamePhase, type GameZone, InternalLottery, type InternalLotteryConfig, type ModeTransitionConfig, type NotificationConfig, NotificationManager, type NotificationPayload, type NotificationType, type PayTable, type PayTableEntry, type Payline, type PaylineResult, Reel, type ReelConfig, ReelController, type ReelControllerConfig, type ReelProps, type ReelStrip, type Replay, type SlipRange, SlotMachine, type SlotMachineProps, SpinCounter, SpinEngine, type SpinEngineConfig, type SpinResult, StopButton, type StopButtonProps, type StopResult, type StopTiming, Symbol, type SymbolDefinition, type SymbolProps, type ThresholdConfig, type ThresholdRange, ThresholdTrigger, type UseSlotMachineConfig, type WinPattern, type WinningRole, type WinningRoleDefinition, type WinningRoleType, type ZoneConfig, type ZoneIndicator, ZoneManager, type ZoneManagerConfig, type ZoneState, useCredit, useDifficulty, useEvent, useGameCycle, useGameMode, useGameZone, useNotification, useSlotMachine, useSoundEffect, useThresholdTrigger };
