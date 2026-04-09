import React from 'react';

/**
 * シンボル定義。リール上に表示される個々のアイコン・絵柄の情報を保持する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const cherry: SymbolDefinition<'cherry' | 'bell'> = {
 *   id: 'cherry',
 *   name: 'チェリー',
 *   weight: 10,
 * };
 * ```
 */
interface SymbolDefinition<S extends string = string> {
    /** シンボルの一意識別子 */
    id: S;
    /** シンボルの表示名 */
    name: string;
    /** 抽選時の重み付け（大きいほど出現しやすい） */
    weight: number;
}
/**
 * リール設定。各リールのシンボル定義とリールストリップを保持する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const reelConfig: ReelConfig<'cherry' | 'bell' | 'bar'> = {
 *   symbols: [
 *     { id: 'cherry', name: 'チェリー', weight: 10 },
 *     { id: 'bell', name: 'ベル', weight: 5 },
 *     { id: 'bar', name: 'BAR', weight: 2 },
 *   ],
 *   reelStrip: ['cherry', 'bell', 'bar', 'cherry', 'bell'],
 * };
 * ```
 */
interface ReelConfig<S extends string = string> {
    /** このリールで使用するシンボル定義の配列 */
    symbols: SymbolDefinition<S>[];
    /** リールストリップ（循環リスト） */
    reelStrip: ReelStrip<S>;
}
/**
 * リールストリップ。リール上のシンボル配列を定義する循環リスト。
 * 配列の末尾の次は先頭に戻る。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const strip: ReelStrip = ['cherry', 'bell', 'bar', 'seven', 'replay'];
 * ```
 */
type ReelStrip<S extends string = string> = S[];

/**
 * ゲームモード列挙型。スロットゲームの現在のモード状態を表す。
 *
 * - `Normal` — 通常モード（デフォルト）
 * - `Chance` — チャンスモード（BT突入のチャンス）
 * - `Bonus` — ボーナスモード（高配当期間）
 * - `BT` — ボーナストリガーモード（SUPER_BIG_BONUS再突入のチャンス）
 *
 * @example
 * ```ts
 * const mode: GameMode = 'Normal';
 * ```
 */
type GameMode = 'Normal' | 'Chance' | 'Bonus' | 'BT';
/**
 * ボーナス種別。ボーナスモード中のボーナスタイプを表す。
 *
 * - `SUPER_BIG_BONUS` — 最上位ボーナス。終了後はBTモードへ移行
 * - `BIG_BONUS` — 上位ボーナス。終了後は通常モードへ移行
 * - `REG_BONUS` — 通常ボーナス。終了後は通常モードへ移行
 *
 * @example
 * ```ts
 * const bonus: BonusType = 'SUPER_BIG_BONUS';
 * ```
 */
type BonusType = 'SUPER_BIG_BONUS' | 'BIG_BONUS' | 'REG_BONUS';
/**
 * 当選役種別。内部抽選で決定される当選役のカテゴリを表す。
 *
 * - `BONUS` — ボーナス当選
 * - `SMALL_WIN` — 小役当選（チェリー、スイカ、ベル等）
 * - `REPLAY` — リプレイ（再遊技）
 * - `MISS` — ハズレ
 *
 * @example
 * ```ts
 * const roleType: WinningRoleType = 'SMALL_WIN';
 * ```
 */
type WinningRoleType = 'BONUS' | 'SMALL_WIN' | 'REPLAY' | 'MISS';
/**
 * 当選役。内部抽選で決定される当選役の詳細情報を保持する。
 *
 * @example
 * ```ts
 * const role: WinningRole = {
 *   id: 'cherry',
 *   name: 'チェリー',
 *   type: 'SMALL_WIN',
 *   payout: 2,
 *   patterns: [['cherry', 'ANY', 'ANY']],
 *   priority: 10,
 * };
 * ```
 */
interface WinningRole {
    /** 当選役の一意識別子 */
    id: string;
    /** 当選役の表示名 */
    name: string;
    /** 当選役種別 */
    type: WinningRoleType;
    /** ボーナス種別（BONUS当選時のみ） */
    bonusType?: BonusType;
    /** 配当額 */
    payout: number;
    /** 成立シンボル組み合わせパターン */
    patterns: string[][];
    /** 優先順位（大きいほど優先） */
    priority: number;
}
/**
 * 小役定義。各小役のID、名前、種別、配当、出目パターン、優先順位を定義する。
 * InternalLotteryに登録して使用する。
 *
 * @example
 * ```ts
 * const bellDef: WinningRoleDefinition = {
 *   id: 'bell',
 *   name: 'ベル',
 *   type: 'SMALL_WIN',
 *   payout: 8,
 *   patterns: [['bell', 'bell', 'bell']],
 *   priority: 30,
 * };
 * ```
 */
interface WinningRoleDefinition {
    /** 小役の一意識別子 */
    id: string;
    /** 小役の表示名 */
    name: string;
    /** 当選役種別 */
    type: WinningRoleType;
    /** 配当額 */
    payout: number;
    /** 成立シンボル組み合わせパターン */
    patterns: string[][];
    /** 優先順位（大きいほど優先） */
    priority: number;
    /** ボーナス種別（BONUS型の当選役で使用。省略時はBONUS_ID_TO_TYPEフォールバック） */
    bonusType?: BonusType;
}
/**
 * 持ち越しフラグ。取りこぼし発生時にボーナス当選状態を次ゲーム以降に持ち越すための情報。
 *
 * @example
 * ```ts
 * const flag: CarryOverFlag = {
 *   winningRole: { id: 'big_bonus', name: 'BIG BONUS', type: 'BONUS', payout: 0, patterns: [], priority: 90 },
 *   gameCount: 3,
 * };
 * ```
 */
interface CarryOverFlag {
    /** 持ち越し中の当選役 */
    winningRole: WinningRole;
    /** 持ち越し開始からのゲーム数 */
    gameCount: number;
}
/**
 * モード遷移確率設定。各モード間の遷移確率を定義する。
 * ボーナス当選確率はInternalLotteryで管理するため、ここには含めない。
 *
 * @example
 * ```ts
 * const config: ModeTransitionConfig = {
 *   normalToChance: 0.02,
 *   chanceTobt: 0.3,
 *   btToSuperBigBonus: 0.1,
 * };
 * ```
 */
interface ModeTransitionConfig {
    /** NormalMode → ChanceMode の遷移確率（0〜1） */
    normalToChance: number;
    /** ChanceMode → BTMode の遷移確率（0〜1） */
    chanceTobt: number;
    /** BTMode → SUPER_BIG_BONUS の再突入確率（0〜1） */
    btToSuperBigBonus: number;
}
/**
 * ボーナス設定。各BonusTypeの配当倍率・継続スピン数・最大獲得枚数を定義する。
 *
 * @example
 * ```ts
 * const config: BonusConfig = {
 *   type: 'BIG_BONUS',
 *   payoutMultiplier: 2,
 *   maxSpins: 30,
 *   maxPayout: 300,
 * };
 * ```
 */
interface BonusConfig {
    /** ボーナス種別 */
    type: BonusType;
    /** 配当倍率 */
    payoutMultiplier: number;
    /** 継続スピン数 */
    maxSpins: number;
    /** 最大獲得枚数（MaxPayout） */
    maxPayout: number;
}
/**
 * BTモード設定。継続スピン数上限、最大獲得枚数、WinPatternを定義する。
 *
 * @example
 * ```ts
 * const btConfig: BTConfig = {
 *   maxSpins: 50,
 *   maxPayout: 500,
 *   winPatterns: [{ symbols: ['seven', 'seven', 'seven'] }],
 * };
 * ```
 */
interface BTConfig {
    /** 継続スピン数上限 */
    maxSpins: number;
    /** 最大獲得枚数（MaxPayout） */
    maxPayout: number;
    /** SUPER_BIG_BONUS再突入のトリガーパターン */
    winPatterns: WinPattern[];
}
/**
 * チャンスモード設定。継続スピン数上限、最大獲得枚数、WinPatternを定義する。
 *
 * @example
 * ```ts
 * const chanceConfig: ChanceConfig = {
 *   maxSpins: 20,
 *   maxPayout: 200,
 *   winPatterns: [{ symbols: ['star', 'star', 'star'] }],
 * };
 * ```
 */
interface ChanceConfig {
    /** 継続スピン数上限 */
    maxSpins: number;
    /** 最大獲得枚数（MaxPayout） */
    maxPayout: number;
    /** BTモード突入のトリガーパターン */
    winPatterns: WinPattern[];
}
/**
 * モード遷移トリガーパターン。特定のシンボル組み合わせが揃った場合にモード遷移を発生させる。
 *
 * @example
 * ```ts
 * // 位置指定なし（いずれかの行でマッチ）
 * const pattern1: WinPattern = { symbols: ['seven', 'seven', 'seven'] };
 * // 位置指定あり（特定の行位置でマッチ）
 * const pattern2: WinPattern = { symbols: ['star', 'star', 'star'], positions: [0, 0, 0] };
 * ```
 */
interface WinPattern {
    /** トリガーとなるシンボルの配列 */
    symbols: string[];
    /** 各リールの行位置（省略時はいずれかの行でマッチ） */
    positions?: number[];
}

/**
 * 当選判定ライン。各リールの行位置を指定し、横・斜め・V字等のパターンを定義する。
 *
 * @example
 * ```ts
 * // 中段横一列
 * const centerLine: Payline = { index: 0, positions: [1, 1, 1] };
 * // 斜めライン（左上→右下）
 * const diagonalLine: Payline = { index: 1, positions: [0, 1, 2] };
 * ```
 */
interface Payline {
    /** ライン番号 */
    index: number;
    /** 各リールの行位置（例: [0,0,0]で上段横一列） */
    positions: number[];
}
/**
 * 配当表。シンボルの組み合わせパターンと配当額の対応を管理する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const payTable: PayTable = {
 *   entries: [
 *     { pattern: ['cherry', 'cherry', 'cherry'], payout: 10, roleType: 'SMALL_WIN' },
 *     { pattern: ['seven', 'seven', 'seven'], payout: 0, roleType: 'BONUS' },
 *   ],
 * };
 * ```
 */
interface PayTable<S extends string = string> {
    /** 配当表エントリの配列 */
    entries: PayTableEntry<S>[];
}
/**
 * 配当表エントリ。1つのシンボル組み合わせパターンと配当額を定義する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const entry: PayTableEntry = {
 *   pattern: ['bell', 'bell', 'bell'],
 *   payout: 8,
 *   roleType: 'SMALL_WIN',
 * };
 * ```
 */
interface PayTableEntry<S extends string = string> {
    /** シンボルの組み合わせパターン */
    pattern: S[];
    /** 配当額 */
    payout: number;
    /** 当選役種別 */
    roleType: WinningRoleType;
}

/**
 * 引き込み範囲。各リールで引き込み可能な最大コマ数を表す。
 * デフォルトは最大4コマ。
 *
 * @example
 * ```ts
 * const slipRange: SlipRange = 4; // 最大4コマ引き込み
 * ```
 */
type SlipRange = number;
/**
 * プレイヤーの停止タイミング。リール上の位置（シンボルインデックス）として表現される。
 * ストップボタン押下時のリール位置を示す。
 *
 * @example
 * ```ts
 * const timing: StopTiming = 5; // リールストリップのインデックス5で停止操作
 * ```
 */
type StopTiming = number;
/**
 * 各リールの停止結果。狙った位置、実際の停止位置、引き込みコマ数、取りこぼし判定を含む。
 *
 * @example
 * ```ts
 * const result: StopResult = {
 *   reelIndex: 0,
 *   targetPosition: 3,
 *   actualPosition: 5,
 *   slipCount: 2,
 *   isMiss: false,
 * };
 * ```
 */
interface StopResult {
    /** リールインデックス（0始まり） */
    reelIndex: number;
    /** プレイヤーが狙った位置 */
    targetPosition: number;
    /** 実際の停止位置（引き込み・蹴飛ばし適用後） */
    actualPosition: number;
    /** 引き込みコマ数 */
    slipCount: number;
    /** 取りこぼしかどうか */
    isMiss: boolean;
}
/**
 * 当選ライン結果。当選したPaylineの情報と配当額を含む。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const paylineResult: PaylineResult = {
 *   lineIndex: 0,
 *   matchedSymbols: ['cherry', 'cherry', 'cherry'],
 *   payout: 10,
 *   payline: { index: 0, positions: [1, 1, 1] },
 * };
 * ```
 */
interface PaylineResult<S extends string = string> {
    /** 当選したライン番号 */
    lineIndex: number;
    /** 一致したシンボルの配列 */
    matchedSymbols: S[];
    /** このラインの配当額 */
    payout: number;
    /** 当選したPayline定義 */
    payline: Payline;
}
/**
 * 1回のスピン結果。グリッド、停止結果、当選ライン、配当、リプレイ・取りこぼし情報を含む。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const spinResult: SpinResult = {
 *   grid: [['cherry', 'bell', 'bar'], ['bell', 'bell', 'bell'], ['bar', 'cherry', 'seven']],
 *   stopResults: [],
 *   winLines: [],
 *   totalPayout: 8,
 *   isReplay: false,
 *   isMiss: false,
 *   winningRole: { id: 'bell', name: 'ベル', type: 'SMALL_WIN', payout: 8, patterns: [], priority: 30 },
 * };
 * ```
 */
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

/**
 * ゲームサイクルフェーズ。1ゲームのライフサイクルにおける各段階を表す。
 *
 * フェーズ順序:
 * BET → LEVER_ON → INTERNAL_LOTTERY → NOTIFICATION_CHECK → REEL_SPINNING →
 * STOP_OPERATION → REEL_STOPPED → RESULT_CONFIRMED → WIN_JUDGE → PAYOUT →
 * MODE_TRANSITION → ZONE_UPDATE → COUNTER_UPDATE → WAITING
 *
 * @example
 * ```ts
 * const phase: GamePhase = 'REEL_SPINNING';
 * ```
 */
type GamePhase = 'BET' | 'LEVER_ON' | 'INTERNAL_LOTTERY' | 'NOTIFICATION_CHECK' | 'REEL_SPINNING' | 'STOP_OPERATION' | 'REEL_STOPPED' | 'RESULT_CONFIRMED' | 'WIN_JUDGE' | 'PAYOUT' | 'MODE_TRANSITION' | 'ZONE_UPDATE' | 'COUNTER_UPDATE' | 'WAITING';
/**
 * リプレイ型。WinningRoleType が 'REPLAY' である当選役を表す。
 * リプレイ当選時はBETを消費せず自動的に次のスピンを開始する。
 *
 * @example
 * ```ts
 * const replay: Replay = {
 *   id: 'replay',
 *   name: 'リプレイ',
 *   type: 'REPLAY',
 *   payout: 0,
 *   patterns: [['replay', 'replay', 'replay']],
 *   priority: 5,
 * };
 * ```
 */
type Replay = WinningRole & {
    type: 'REPLAY';
};

/**
 * 告知タイミング。告知イベントが発火するタイミングを表す。
 *
 * - `PRE_SPIN` — スピン開始前の先告知
 * - `POST_SPIN` — リール停止後の後告知
 * - `NEXT_BET` — 次ゲームBET時の告知
 * - `LEVER_ON` — レバーON時の告知
 *
 * @example
 * ```ts
 * const timing: NotificationType = 'PRE_SPIN';
 * ```
 */
type NotificationType = 'PRE_SPIN' | 'POST_SPIN' | 'NEXT_BET' | 'LEVER_ON';
/**
 * 告知ペイロード。告知イベント発火時にコールバックへ渡されるデータ。
 *
 * @example
 * ```ts
 * const payload: NotificationPayload = {
 *   type: 'PRE_SPIN',
 *   winningRole: { id: 'big_bonus', name: 'BIG BONUS', type: 'BONUS', payout: 0, patterns: [], priority: 90 },
 *   timestamp: Date.now(),
 * };
 * ```
 */
interface NotificationPayload {
    /** 告知タイミング */
    type: NotificationType;
    /** 告知対象の当選役 */
    winningRole: WinningRole;
    /** スピン結果（POST_SPIN時に含まれる） */
    spinResult?: SpinResult;
    /** 告知発火時のタイムスタンプ */
    timestamp: number;
}
/**
 * 告知設定。各告知タイミングの有効/無効、告知対象の当選役種別、コールバックを定義する。
 *
 * @example
 * ```ts
 * const config: NotificationConfig = {
 *   enabledTypes: { PRE_SPIN: true, POST_SPIN: false, NEXT_BET: true, LEVER_ON: false },
 *   targetRoleTypes: ['BONUS'],
 *   onNotification: (payload) => console.log('告知:', payload.type),
 * };
 * ```
 */
interface NotificationConfig {
    /** 各NotificationTypeの有効/無効設定 */
    enabledTypes: Partial<Record<NotificationType, boolean>>;
    /** 告知対象とするWinningRoleTypeの一覧 */
    targetRoleTypes: WinningRoleType[];
    /** 告知発火時のコールバック */
    onNotification?: (payload: NotificationPayload) => void;
    /** NotificationTypeごとの個別コールバック */
    callbacks?: Partial<Record<NotificationType, (payload: NotificationPayload) => void>>;
}

/**
 * ゲームゾーン識別子。ゲーム全体を区間として分割する上位レイヤーの状態単位。
 * GameModeの上位概念として機能する（例: 通常区間、特別区間）。
 *
 * @example
 * ```ts
 * const zone: GameZone = 'normal';
 * ```
 */
type GameZone = string;
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
interface ZoneConfig {
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
interface ZoneState {
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
interface ZoneIndicator {
    /** 特別区間かどうか */
    isSpecialZone: boolean;
    /** ゾーンの表示名 */
    zoneName: string;
}

/**
 * BET設定。初期クレジット額、BET額バリエーション、デフォルトBET額を定義する。
 *
 * @example
 * ```ts
 * const config: BetConfig = {
 *   initialCredit: 1000,
 *   betOptions: [1, 2, 3],
 *   defaultBet: 3,
 *   historySize: 50,
 * };
 * ```
 */
interface BetConfig {
    /** 初期クレジット額 */
    initialCredit: number;
    /** BET額のバリエーション */
    betOptions: number[];
    /** デフォルトのBET額 */
    defaultBet: number;
    /** 変動履歴の保持件数（省略時はデフォルト値を使用） */
    historySize?: number;
    /**
     * BET額ごとの有効Paylineインデックス。
     * 省略時は全Paylineが有効。
     * @example { 1: [1], 2: [0,1,2], 3: [0,1,2,3,4] }
     */
    paylinesPerBet?: Record<number, number[]>;
    /**
     * BET額ごとの抽選制限。指定されたBET額未満では抽選対象外となるWinningRole IDの一覧。
     * @example { 3: ['super_big_bonus'] } — super_big_bonusは3BET時のみ抽選
     */
    exclusiveRolesPerBet?: Record<number, string[]>;
}
/**
 * クレジット変動履歴。クレジット残高の変動1件分の情報を保持する。
 *
 * @example
 * ```ts
 * const history: CreditHistory = {
 *   type: 'BET',
 *   amount: 3,
 *   balanceAfter: 997,
 *   timestamp: 1700000000000,
 * };
 * ```
 */
interface CreditHistory {
    /** 変動種別 */
    type: 'BET' | 'PAYOUT' | 'DEPOSIT' | 'WITHDRAW';
    /** 変動額 */
    amount: number;
    /** 変動後の残高 */
    balanceAfter: number;
    /** 変動時のタイムスタンプ */
    timestamp: number;
}
/**
 * クレジット状態。現在の残高、BET額、変動履歴を保持する。
 *
 * @example
 * ```ts
 * const state: CreditState = {
 *   balance: 500,
 *   currentBet: 3,
 *   history: [],
 * };
 * ```
 */
interface CreditState {
    /** 現在のクレジット残高 */
    balance: number;
    /** 現在のBET額 */
    currentBet: number;
    /** 変動履歴 */
    history: CreditHistory[];
}

/**
 * 閾値範囲（振り分け天井）。最小値と最大値を持ち、範囲内からランダムに閾値を決定する。
 *
 * @example
 * ```ts
 * const range: ThresholdRange = { min: 500, max: 800 };
 * ```
 */
interface ThresholdRange {
    /** 閾値の最小値 */
    min: number;
    /** 閾値の最大値 */
    max: number;
}
/**
 * 閾値トリガー設定。対象カウンター、閾値、トリガー時のアクション、リセット条件を定義する。
 *
 * @example
 * ```ts
 * // 固定閾値
 * const fixedConfig: ThresholdConfig = {
 *   counterName: 'normalSpins',
 *   targetGameMode: 'Normal',
 *   threshold: 1000,
 *   action: 'forceBonus',
 *   resetCondition: 'BonusMode',
 * };
 *
 * // 振り分け天井
 * const rangeConfig: ThresholdConfig = {
 *   counterName: 'normalSpins',
 *   targetGameMode: 'Normal',
 *   threshold: { min: 500, max: 800 },
 *   action: 'forceChance',
 *   resetCondition: 'BonusMode',
 * };
 * ```
 */
interface ThresholdConfig {
    /** 対象カウンター名 */
    counterName: string;
    /** カウント対象のGameMode */
    targetGameMode: GameMode;
    /** 閾値（固定値またはThresholdRange） */
    threshold: number | ThresholdRange;
    /** 閾値到達時に実行するアクション名 */
    action: string;
    /** カウンターリセット条件 */
    resetCondition: string;
}

/**
 * 設定段階パラメータ。各設定段階における内部抽選確率・モード遷移確率・リプレイ確率を定義する。
 *
 * @example
 * ```ts
 * const config: DifficultyConfig = {
 *   level: 1,
 *   lotteryProbabilities: { cherry: 0.12, bell: 0.08, replay: 0.16 },
 *   transitionProbabilities: { normalToChance: 0.01 },
 *   replayProbability: 0.16,
 * };
 * ```
 */
interface DifficultyConfig {
    /** 設定段階番号 */
    level: number;
    /** 内部抽選確率（小役ID → 確率） */
    lotteryProbabilities: Record<string, number>;
    /** モード遷移確率の上書き */
    transitionProbabilities: Partial<ModeTransitionConfig>;
    /** リプレイ確率 */
    replayProbability: number;
}
/**
 * 設定段階プリセット設定。全設定段階のパラメータと初期設定段階を定義する。
 *
 * @example
 * ```ts
 * const preset: DifficultyPresetConfig = {
 *   levels: {
 *     1: { level: 1, lotteryProbabilities: { cherry: 0.12 }, transitionProbabilities: {}, replayProbability: 0.16 },
 *     6: { level: 6, lotteryProbabilities: { cherry: 0.15 }, transitionProbabilities: {}, replayProbability: 0.18 },
 *   },
 *   initialLevel: 1,
 * };
 * ```
 */
interface DifficultyPresetConfig {
    /** 設定段階ごとのパラメータ */
    levels: Record<number, DifficultyConfig>;
    /** 初期設定段階 */
    initialLevel: number;
}

/**
 * アニメーション設定。リールの回転・停止アニメーションのパラメータを定義する。
 *
 * @example
 * ```ts
 * const config: AnimationConfig = {
 *   spinSpeed: 0.5,
 *   easing: 'ease-in-out',
 *   stopDelays: [0, 200, 400],
 *   accelerationDuration: 300,
 *   decelerationDuration: 500,
 * };
 * ```
 */
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

/**
 * 標準イベント型。EventEmitterで発火・購読されるゲームイベントの種類を表す。
 *
 * - `spinStart` — スピン開始
 * - `reelStop` — リール停止
 * - `win` — 当選
 * - `bonusStart` — ボーナス開始
 * - `modeChange` — モード変更
 * - `zoneChange` — ゾーン変更
 * - `phaseChange` — フェーズ変更
 * - `creditChange` — クレジット変動
 * - `notification` — 告知
 *
 * @example
 * ```ts
 * const event: GameEvent = 'spinStart';
 * ```
 */
type GameEvent = 'spinStart' | 'reelStop' | 'win' | 'bonusStart' | 'modeChange' | 'zoneChange' | 'phaseChange' | 'creditChange' | 'notification';

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
interface GameConfig<S extends string = string> {
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

/**
 * メインコンテナコンポーネントのprops。リール群とストップボタンを統合表示する。
 */
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
    /** カスタムレイアウト。指定時はchildren要素のみをレンダリングする */
    children?: React.ReactNode;
    /** CSSクラス名 */
    className?: string;
    /** インラインスタイル */
    style?: React.CSSProperties;
}
/**
 * スロットゲーム全体を管理するメインコンテナコンポーネント。
 * リール群とストップボタンを横並びにレンダリングする。
 *
 * - `children` を渡すとカスタムレイアウトとしてレンダリング
 * - `showStopButtons` で各リールのストップボタン表示を制御
 */
declare function SlotMachine<S extends string = string>({ reelCount, rowCount, symbols, renderSymbol, animationConfig, showStopButtons, children, className, style, }: SlotMachineProps<S>): React.ReactElement;

/** リールの回転方向 */
type ReelDirection = 'down' | 'up';
/**
 * 個別リールコンポーネントのprops。
 */
interface ReelProps<S extends string = string> {
    /** シンボルリスト（リールストリップ） */
    symbols: S[];
    /** スピン状態 */
    spinning: boolean;
    /** 停止位置インデックス（デフォルト: 0） */
    stopPosition?: number;
    /** シンボルのカスタムレンダリング関数 */
    renderSymbol?: (symbolId: S) => React.ReactNode;
    /** 表示行数（デフォルト: 3） */
    rowCount?: number;
    /** 1シンボルの高さpx（デフォルト: 40） */
    symbolHeight?: number;
    /** 回転速度 秒/1周（デフォルト: 0.6） */
    spinDuration?: number;
    /** 回転方向（デフォルト: 'down'） */
    direction?: ReelDirection;
    /** CSSクラス名 */
    className?: string;
    /** インラインスタイル */
    style?: React.CSSProperties;
}
declare function Reel<S extends string = string>({ symbols, spinning, stopPosition, renderSymbol, rowCount, symbolHeight, spinDuration, direction, className, style, }: ReelProps<S>): React.ReactElement;

/**
 * 個別シンボルコンポーネントのprops。
 */
interface SymbolProps<S extends string = string> {
    /** シンボルID */
    symbolId: S;
    /** カスタムレンダリング関数。省略時はシンボルIDをテキスト表示する */
    renderSymbol?: (symbolId: S) => React.ReactNode;
    /** 当選ラインに含まれているか。trueの場合ハイライト用CSSクラスが付与される */
    highlighted?: boolean;
    /** CSSクラス名 */
    className?: string;
}
/**
 * 個別シンボルコンポーネント。リール上に表示される1つのシンボルをレンダリングする。
 *
 * - `renderSymbol` を渡すとカスタム表示、省略時はシンボルIDのテキスト表示
 * - `highlighted` が true の場合、`reeljs-symbol--highlighted` CSSクラスが付与される
 */
declare function Symbol<S extends string = string>({ symbolId, renderSymbol, highlighted, className, }: SymbolProps<S>): React.ReactElement;

/**
 * ストップボタンコンポーネントのprops。
 */
interface StopButtonProps {
    /** 対応するリールインデックス（0始まり） */
    reelIndex: number;
    /** ボタン有効/無効（デフォルト: false） */
    disabled?: boolean;
    /** 押下時コールバック。リールインデックスとStopTimingを受け取る */
    onStop: (reelIndex: number, timing: StopTiming) => void;
    /** CSSクラス名 */
    className?: string;
    /** インラインスタイル */
    style?: React.CSSProperties;
    /** アクセシビリティラベル（デフォルト: "Stop reel N"） */
    'aria-label'?: string;
}
/**
 * 各リールに対応するストップボタンコンポーネント。
 * ボタン押下時にReelControllerへStopTimingを通知する。
 *
 * - 対応リールが回転中のみ有効、停止中は無効
 * - `aria-label` でアクセシビリティ対応
 */
declare function StopButton({ reelIndex, disabled, onStop, className, style, 'aria-label': ariaLabel, }: StopButtonProps): React.ReactElement;

/**
 * 内部抽選モジュールの設定。GameMode別の当選確率、小役定義、カスタム乱数生成関数を含む。
 *
 * @example
 * ```ts
 * const config: InternalLotteryConfig = {
 *   probabilities: {
 *     Normal: { cherry: 0.12, bell: 0.08, replay: 0.16, miss: 0.64 },
 *     Chance: { cherry: 0.15, bell: 0.10, replay: 0.16, miss: 0.59 },
 *     Bonus: { bell: 0.30, replay: 0.05, miss: 0.65 },
 *     BT: { cherry: 0.12, bell: 0.08, replay: 0.16, miss: 0.64 },
 *   },
 *   winningRoleDefinitions: [],
 * };
 * ```
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
 * 内部抽選モジュール。レバーON時に当選役（WinningRole）を決定する。
 * GameMode・DifficultyPreset に応じた確率抽選、CarryOverFlag 管理、
 * カスタム小役定義のバリデーションを提供する。
 *
 * @example
 * ```ts
 * const lottery = new InternalLottery({
 *   probabilities: { Normal: { cherry: 0.12, replay: 0.16 }, Chance: {}, Bonus: {}, BT: {} },
 *   winningRoleDefinitions: [],
 * });
 * const role = lottery.draw('Normal');
 * console.log(role.type); // 'SMALL_WIN' | 'REPLAY' | 'BONUS' | 'MISS'
 * ```
 */
declare class InternalLottery {
    private readonly probabilities;
    private readonly roleDefinitions;
    private readonly roleMap;
    private readonly randomFn;
    private carryOver;
    constructor(config: InternalLotteryConfig);
    /**
     * 内部抽選を実行し、WinningRole を返却する。
     * excludeRoleIds が指定された場合、該当する当選役を抽選対象から除外する
     * （BET額に応じた抽選制限に使用）。
     *
     * @param gameMode - 現在のゲームモード
     * @param difficultyLevel - 設定段階（オプション）
     * @param excludeRoleIds - 抽選対象から除外するWinningRole IDの配列（オプション）
     * @returns 当選役
     */
    draw(gameMode: GameMode, _difficultyLevel?: number, excludeRoleIds?: string[]): WinningRole;
    /**
     * CarryOverFlag を設定する。取りこぼし時にボーナス当選状態を持ち越す。
     *
     * @param winningRole - 持ち越す当選役
     */
    setCarryOver(winningRole: WinningRole): void;
    /**
     * 現在の CarryOverFlag を取得する。
     *
     * @returns 持ち越しフラグ。持ち越し中でない場合はnull
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
     * 停止位置決定。当選役のパターンに基づいて引き込み（Slip）・蹴飛ばし（Reject）を適用し、
     * 最終停止位置を決定する。
     *
     * @param reelIndex - リールインデックス（0始まり）
     * @param winningRole - 内部当選役
     * @param stopTiming - プレイヤーの停止タイミング
     * @returns 停止結果
     * @throws リールインデックスまたはStopTimingが範囲外の場合
     */
    determineStopPosition(reelIndex: number, winningRole: WinningRole, stopTiming: StopTiming): StopResult;
    /**
     * AutoStop実行。全リールをランダムタイミングで停止する。
     *
     * @param winningRole - 内部当選役
     * @returns 全リールの停止結果
     */
    autoStopAll(winningRole: WinningRole): StopResult[];
    /**
     * 停止コールバック登録。リール停止時にStopResultを受け取るコールバックを登録する。
     *
     * @param callback - 停止結果を受け取るコールバック関数
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
 * evaluateFromStopResults のオプション。
 *
 * @example
 * ```ts
 * const options: EvaluateFromStopResultsOptions = {
 *   betAmount: 3,
 *   activePaylineIndices: [0, 1, 2],
 * };
 * ```
 */
interface EvaluateFromStopResultsOptions {
    /** BET額（winLine.payoutに乗算） */
    betAmount?: number;
    /** 有効Paylineインデックス配列（省略時は全Payline） */
    activePaylineIndices?: number[];
}
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
     * 統合スピン実行。
     * winningRole が渡された場合は ReelController で出目制御を行い、
     * 渡されていない場合は重み付けランダム抽選にフォールバックする。
     *
     * @param winningRole - 内部当選役（省略時はランダムフォールバック）
     * @param stopTimings - 各リールのStopTiming配列（省略時はランダム生成）
     * @param options - BET額・有効Paylineインデックスのオプション
     * @returns スピン結果
     */
    spin(winningRole?: WinningRole, stopTimings?: StopTiming[], options?: {
        betAmount?: number;
        activePaylineIndices?: number[];
    }): SpinResult<S>;
    /**
     * InternalLottery のみ実行し、当選役を決定する。
     *
     * @param gameMode - 現在のゲームモード
     * @param difficulty - 設定段階（オプション）
     * @returns 当選役
     * @throws InternalLotteryが未設定の場合
     */
    lottery(gameMode: GameMode, difficulty?: number): WinningRole;
    /**
     * ReelController のみ実行し、各リールの停止位置を決定する。
     *
     * @param winningRole - 内部当選役
     * @param stopTimings - 各リールのStopTiming配列（省略時はランダム生成）
     * @returns 各リールの停止結果
     */
    controlReels(winningRole: WinningRole, stopTimings?: StopTiming[]): StopResult[];
    /**
     * Payline 評価のみ実行（全Payline対象）。横・斜め・V字等のカスタムパターンに対応。
     *
     * Payline評価のみが必要な場合はこのメソッドを直接使用可能。
     * StopResultsから完全なSpinResultが必要な場合は {@link evaluateFromStopResults} を使用する。
     *
     * @param grid - シンボルグリッド（grid[row][reel]）
     * @returns 当選ライン結果の配列
     */
    evaluatePaylines(grid: S[][]): PaylineResult<S>[];
    /**
     * 事前決定済みのStopResult配列からSpinResultを構築する。
     * controlReelsを再実行せず、stopResultsのactualPositionからgridを構築し、
     * Payline評価を行う。
     *
     * Payline評価のみが必要な場合は {@link evaluatePaylines} を直接使用可能。
     * 本メソッドはgrid構築・フラグ導出・SpinResult組み立てを含む
     * 一連のボイラープレートをライブラリ側で吸収する。
     *
     * @param stopResults - 各リールの停止結果配列
     * @param winningRole - 内部当選役
     * @param options - BET額・有効Paylineインデックスのオプション
     * @returns スピン結果
     */
    evaluateFromStopResults(stopResults: StopResult[], winningRole: WinningRole, options?: EvaluateFromStopResultsOptions): SpinResult<S>;
    /**
     * 指定されたPayline配列に対してPayline評価を実行する。
     */
    private evaluatePaylinesInternal;
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
 * クレジット残高管理モジュール。BET消費・Payout加算・投入/引き出し操作を一元管理し、
 * 残高不足時のスピン拒否やBET額バリエーションの設定を行う。
 *
 * @example
 * ```ts
 * const manager = new CreditManager({
 *   initialCredit: 1000,
 *   betOptions: [1, 2, 3],
 *   defaultBet: 3,
 * });
 * manager.bet();       // BET消費
 * manager.payout(10);  // 配当加算
 * console.log(manager.balance); // 1007
 * ```
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
 *
 * @example
 * ```ts
 * const emitter = new EventEmitter();
 * const unsub = emitter.on<number>('win', (payout) => console.log('Win:', payout));
 * emitter.emit('win', 100); // "Win: 100"
 * unsub(); // 購読解除
 * ```
 */
declare class EventEmitter {
    private listeners;
    /**
     * イベントを発火し、登録済みの全リスナーにペイロードを配信する。
     * 購読者がいない場合は何もしない。
     *
     * @typeParam T - ペイロードの型
     * @param event - イベント名
     * @param payload - イベントペイロード（省略可）
     */
    emit<T = unknown>(event: string, payload?: T): void;
    /**
     * イベントを購読する。
     *
     * @typeParam T - ペイロードの型
     * @param event - イベント名
     * @param listener - イベントリスナー関数
     * @returns 購読解除関数
     */
    on<T = unknown>(event: string, listener: (payload: T) => void): () => void;
    /**
     * イベントの購読を解除する。
     *
     * @param event - イベント名
     * @param listener - 解除するリスナー関数
     */
    off(event: string, listener: Function): void;
}

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
 * forceTransition のオプション。
 * Bonusモード遷移時は bonusType の指定が必須。
 */
interface ForceTransitionOptions {
    /** Bonusモード遷移時のボーナス種別（Bonus指定時は必須） */
    bonusType?: BonusType;
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
     * 確率判定・遷移バリデーションをバイパスして指定モードへ強制遷移する。
     * 天井到達時のNormal→BT直接突入やデバッグ用途に使用。
     *
     * @param targetMode - 遷移先のGameMode
     * @param options - オプション設定
     * @throws targetModeが'Bonus'でoptions.bonusTypeが未指定の場合
     */
    forceTransition(targetMode: GameMode, options?: ForceTransitionOptions): void;
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
 * 告知タイミング判定・イベント発火モジュール。
 * InternalLottery の WinningRole 結果に基づき、設定された告知タイミングで
 * onNotification コールバックを発火する。演出（UI/アニメーション/サウンド）は
 * 提供せず、ロジックとイベント発火のみを担当する。
 *
 * @example
 * ```ts
 * const manager = new NotificationManager({
 *   enabledTypes: { PRE_SPIN: true, NEXT_BET: true },
 *   targetRoleTypes: ['BONUS'],
 *   onNotification: (payload) => console.log('告知:', payload.type, payload.winningRole.name),
 * });
 * manager.check('PRE_SPIN', bonusRole);
 * ```
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
interface ZoneManagerConfig {
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
     * ゾーン更新。SpinResult に基づいてゲーム数・差枚数を更新し、ゾーン終了判定を行う。
     *
     * @param spinResult - スピン結果
     */
    update(spinResult: SpinResult): void;
    /**
     * ゾーン遷移コールバック登録。ゾーン遷移時に遷移元・遷移先を受け取るコールバックを登録する。
     *
     * @param callback - 遷移元ゾーンと遷移先ゾーンを受け取るコールバック
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
interface CounterConfig {
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
declare class SpinCounter {
    private counters;
    private configs;
    constructor(configs?: CounterConfig[]);
    /**
     * カウンター値を名前で取得する。未知のカウンターの場合は0を返す。
     *
     * @param name - カウンター名
     * @returns カウンター値
     */
    get(name: string): number;
    /**
     * カウンターをインクリメントする。存在しないカウンターの場合は新規作成する。
     *
     * @param name - カウンター名
     */
    increment(name: string): void;
    /**
     * カウンターを0にリセットする。
     *
     * @param name - カウンター名
     */
    reset(name: string): void;
    /**
     * 全カウンターの値をレコードとして取得する。
     *
     * @returns カウンター名と値のレコード
     */
    getAll(): Record<string, number>;
    /**
     * 指定カウンターの設定を取得する。
     *
     * @param name - カウンター名
     * @returns カウンター設定。未定義の場合はundefined
     */
    getConfig(name: string): CounterConfig | undefined;
    /**
     * リセット条件に一致するカウンターをリセットする。
     *
     * @param condition - リセット条件文字列
     * @returns リセットされたカウンター名の配列
     */
    checkResetCondition(condition: string): string[];
}

/**
 * 依存モジュールを注入する設定オブジェクト。各モジュールはオプショナル — 未提供時はスキップされる。
 *
 * @example
 * ```ts
 * const config: GameCycleManagerConfig = {
 *   spinEngine: mySpinEngine,
 *   creditManager: myCreditManager,
 *   gameModeManager: myGameModeManager,
 *   eventEmitter: myEventEmitter,
 * };
 * ```
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
 * 1ゲームのライフサイクルを統合管理するオーケストレーター。
 *
 * BET→LEVER_ON→INTERNAL_LOTTERY→NOTIFICATION_CHECK→REEL_SPINNING→
 * STOP_OPERATION→REEL_STOPPED→RESULT_CONFIRMED→WIN_JUDGE→PAYOUT→
 * MODE_TRANSITION→ZONE_UPDATE→COUNTER_UPDATE→WAITING の14フェーズを順序管理し、
 * 各フェーズで対応するモジュールを呼び出す。
 *
 * @example
 * ```ts
 * const manager = new GameCycleManager({
 *   spinEngine: mySpinEngine,
 *   creditManager: myCreditManager,
 * });
 * manager.onPhaseChange((from, to) => console.log(`${from} → ${to}`));
 * manager.startCycle();
 * ```
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
     * ゲームサイクル開始。リプレイ時はBETをスキップしてLEVER_ONから開始する。
     */
    startCycle(): void;
    /**
     * フェーズ遷移コールバック登録。フェーズ遷移時に遷移元・遷移先を受け取るコールバックを登録する。
     *
     * @param callback - 遷移元フェーズと遷移先フェーズを受け取るコールバック
     */
    onPhaseChange(callback: (from: GamePhase, to: GamePhase) => void): void;
    /**
     * ストップ操作通知。プレイヤーのストップボタン押下を記録する。
     *
     * @param reelIndex - リールインデックス
     * @param timing - 停止タイミング
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
/**
 * useSlotMachineフックの設定。SpinEngine設定、クレジット設定、ゲームサイクル設定を含む。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const config: UseSlotMachineConfig = {
 *   spinEngine: { reelConfigs: [...], payTable: { entries: [] }, paylines: [] },
 *   credit: { initialCredit: 1000, betOptions: [1, 2, 3], defaultBet: 3 },
 * };
 * ```
 */
interface UseSlotMachineConfig<S extends string = string> {
    /** SpinEngineの設定 */
    spinEngine: SpinEngineConfig<S>;
    /** クレジット設定（省略時はクレジット管理なし） */
    credit?: BetConfig;
    /** ゲームサイクル設定（省略時はサイクル管理なし） */
    gameCycle?: GameCycleManagerConfig;
}
/**
 * メインフック。スピン状態・フェーズ・結果のリアクティブ管理を提供する。
 * CreditManager経由のクレジット確認・BET消費 → SpinEngine抽選 → Payout加算を統合実行する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 * @param config - {@link UseSlotMachineConfig}
 * @returns スピン状態、フェーズ、結果、spin/reset関数
 *
 * @example
 * ```tsx
 * function SlotGame() {
 *   const { spinState, spinResult, spin, reset } = useSlotMachine({
 *     spinEngine: { reelConfigs, payTable, paylines },
 *     credit: { initialCredit: 1000, betOptions: [3], defaultBet: 3 },
 *   });
 *   return (
 *     <div>
 *       <p>状態: {spinState}</p>
 *       <button onClick={spin} disabled={spinState === 'spinning'}>Spin</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
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
 * GameModeManager をラップし、モード遷移のリアクティブ状態を提供するフック。
 * 現在のGameMode、BonusType、残りスピン数をリアクティブに返却する。
 *
 * @param config - GameModeManagerの設定（遷移確率、ボーナス設定等）
 * @returns モード状態とevaluateTransition関数
 *
 * @example
 * ```tsx
 * function ModeDisplay() {
 *   const { currentMode, currentBonusType, remainingSpins, evaluateTransition } = useGameMode({
 *     transitionConfig: { normalToChance: 0.02, chanceTobt: 0.3, btToSuperBigBonus: 0.1 },
 *     bonusConfigs: { ... },
 *     btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [] },
 *     chanceConfig: { maxSpins: 20, maxPayout: 200, winPatterns: [] },
 *   });
 *   return <p>Mode: {currentMode}</p>;
 * }
 * ```
 */
declare function useGameMode(config: GameModeManagerConfig): {
    currentMode: GameMode;
    currentBonusType: BonusType | null;
    remainingSpins: number | null;
    evaluateTransition: (spinResult: SpinResult, winningRole: WinningRole) => void;
    _manager: GameModeManager;
};

/**
 * GameCycleManager をラップし、ゲームサイクルのリアクティブ状態を提供するフック。
 * 現在のGamePhase、リプレイ状態をリアクティブに返却し、各フェーズへのコールバック登録を提供する。
 *
 * @param config - GameCycleManagerの設定（依存モジュール群）
 * @returns ゲームサイクル状態とアクション関数
 *
 * @example
 * ```tsx
 * function GameScreen() {
 *   const { currentPhase, isReplay, startCycle, onPhase } = useGameCycle({
 *     spinEngine: mySpinEngine,
 *     creditManager: myCreditManager,
 *   });
 *   onPhase('WIN_JUDGE', () => console.log('当選判定中'));
 *   return <button onClick={startCycle}>Start</button>;
 * }
 * ```
 */
declare function useGameCycle(config: GameCycleManagerConfig): {
    currentPhase: GamePhase;
    isReplay: boolean;
    startCycle: () => void;
    onPhase: (phase: GamePhase, callback: () => void) => void;
    _manager: GameCycleManager;
};

/**
 * ZoneManager をラップし、ゾーン管理のリアクティブ状態を提供するフック。
 * 現在のゾーン、消化ゲーム数、差枚数、残りゲーム数等をリアクティブに返却する。
 *
 * @param config - ZoneManagerの設定（ゾーン定義、初期ゾーン）
 * @returns ゾーン状態とupdate関数
 *
 * @example
 * ```tsx
 * function ZoneDisplay() {
 *   const { currentZone, gamesPlayed, remainingGames, indicator, update } = useGameZone({
 *     zones: {
 *       normal: { name: '通常区間', maxGames: 1500, maxNetCredits: 2400, resetTargets: [], nextZone: 'special', isSpecial: false },
 *       special: { name: '特別区間', maxGames: 500, maxNetCredits: 1000, resetTargets: ['gameMode'], nextZone: 'normal', isSpecial: true },
 *     },
 *     initialZone: 'normal',
 *   });
 *   return <p>{indicator.zoneName}: 残り{remainingGames}G</p>;
 * }
 * ```
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
 * CreditManager をラップし、クレジット管理のリアクティブ状態を提供するフック。
 * 残高、BET額、変動履歴をリアクティブに返却し、setBet/deposit/withdrawアクションを提供する。
 *
 * @param config - BET設定（初期クレジット額、BET額バリエーション等）
 * @returns クレジット状態とアクション関数
 *
 * @example
 * ```tsx
 * function CreditPanel() {
 *   const { balance, currentBet, canSpin, setBet, deposit } = useCredit({
 *     initialCredit: 1000,
 *     betOptions: [1, 2, 3],
 *     defaultBet: 3,
 *   });
 *   return (
 *     <div>
 *       <p>残高: {balance} / BET: {currentBet}</p>
 *       <button disabled={!canSpin}>Spin</button>
 *     </div>
 *   );
 * }
 * ```
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
 * NotificationManager をラップし、告知状態のリアクティブ管理を提供するフック。
 * 告知状態（pending/notified/idle）、直近のペイロード、各タイミングの個別コールバック登録を提供する。
 *
 * @param config - 告知設定（有効タイミング、対象当選役種別等）
 * @returns 告知状態とアクション関数
 *
 * @example
 * ```tsx
 * function NotificationPanel() {
 *   const { status, lastPayload, acknowledgeNotification, onPreSpin } = useNotification({
 *     enabledTypes: { PRE_SPIN: true },
 *     targetRoleTypes: ['BONUS'],
 *   });
 *   onPreSpin((payload) => console.log('先告知:', payload.winningRole.name));
 *   return <p>告知状態: {status}</p>;
 * }
 * ```
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
 * EventEmitter からのイベント購読と対応サウンドの自動再生を管理するフック。
 * ミュート切り替え・音量調整機能を提供する。
 *
 * @param soundMap - イベント名とサウンドファイルURLのマッピング
 * @param emitter - EventEmitterインスタンス（省略時はイベント購読なし）
 * @returns サウンド状態と制御関数
 *
 * @example
 * ```tsx
 * const emitter = new EventEmitter();
 * function GameScreen() {
 *   const { isMuted, volume, toggleMute, setVolume } = useSoundEffect(
 *     { spinStart: '/sounds/spin.mp3', win: '/sounds/win.mp3' },
 *     emitter,
 *   );
 *   return <button onClick={toggleMute}>{isMuted ? '🔇' : '🔊'}</button>;
 * }
 * ```
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
 * SpinCounterの値を閾値と比較し、到達時にアクションを発火するモジュール。
 * 固定閾値とThresholdRange（振り分け天井）の両方をサポートする。
 * ThresholdRange使用時はカウンターリセット時に閾値を再抽選する。
 *
 * @example
 * ```ts
 * const trigger = new ThresholdTrigger([
 *   { counterName: 'normalSpins', targetGameMode: 'Normal', threshold: { min: 500, max: 800 }, action: 'forceBonus', resetCondition: 'BonusMode' },
 * ]);
 * trigger.onThresholdReached((name, value, action) => console.log(`${name}: ${value} → ${action}`));
 * trigger.check('normalSpins', 750); // 閾値到達時にコールバック発火
 * ```
 */
declare class ThresholdTrigger {
    private configs;
    private resolvedThresholds;
    private callbacks;
    private randomFn;
    constructor(configs?: ThresholdConfig[], randomFn?: () => number);
    /**
     * カウンター値が閾値に到達したかチェックする。到達時はコールバックを発火しtrueを返す。
     *
     * @param counterName - カウンター名
     * @param value - 現在のカウンター値
     * @returns 閾値に到達した場合true
     */
    check(counterName: string, value: number): boolean;
    /**
     * 閾値到達時のコールバックを登録する。
     *
     * @param callback - カウンター名、到達値、アクション名を受け取るコールバック
     */
    onThresholdReached(callback: ThresholdReachedCallback): void;
    /**
     * 閾値を再抽選する（ThresholdRange設定時）。固定閾値の場合は変更なし。
     *
     * @param counterName - カウンター名
     */
    reroll(counterName: string): void;
    /**
     * 指定カウンターの現在の解決済み閾値を取得する。
     *
     * @param counterName - カウンター名
     * @returns 解決済み閾値。未定義の場合はundefined
     */
    getThreshold(counterName: string): number | undefined;
    /**
     * 全カウンターの解決済み閾値をレコードとして取得する。
     *
     * @returns カウンター名と閾値のレコード
     */
    getAllThresholds(): Record<string, number>;
}

/**
 * SpinCounter / ThresholdTrigger をラップし、カウンターと閾値のリアクティブ状態を提供するフック。
 * 各カウンターの現在値と設定された閾値をリアクティブに返却する。
 *
 * @param configs - 閾値トリガー設定の配列
 * @returns カウンター状態、閾値状態、resetCounter関数
 *
 * @example
 * ```tsx
 * function ThresholdDisplay() {
 *   const { counters, thresholds, resetCounter } = useThresholdTrigger([
 *     { counterName: 'normalSpins', targetGameMode: 'Normal', threshold: 1000, action: 'forceBonus', resetCondition: 'BonusMode' },
 *   ]);
 *   return <p>カウンター: {counters.normalSpins} / 天井: {thresholds.normalSpins}</p>;
 * }
 * ```
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
declare class DifficultyPreset {
    private _currentLevel;
    private readonly levels;
    constructor(config: DifficultyPresetConfig);
    /** 現在の設定段階 */
    get currentLevel(): number;
    /** 現在のDifficultyConfig */
    get currentConfig(): DifficultyConfig;
    /**
     * 設定段階変更。指定した段階のDifficultyConfigに切り替える。
     *
     * @param level - 設定段階番号
     * @throws 未定義の設定段階が指定された場合
     */
    setDifficulty(level: number): void;
    /**
     * 利用可能な設定段階一覧を取得する。
     *
     * @returns 設定段階番号の配列
     */
    getAvailableLevels(): number[];
    private validateConfig;
    private validateDifficultyConfig;
}

/**
 * DifficultyPreset をラップし、設定段階のリアクティブ管理を提供するフック。
 * 現在の設定段階とDifficultyConfigをリアクティブに返却する。
 *
 * @param config - 設定段階プリセット設定
 * @returns 設定段階状態とsetDifficulty関数
 *
 * @example
 * ```tsx
 * function DifficultySelector() {
 *   const { currentLevel, currentConfig, setDifficulty } = useDifficulty({
 *     levels: {
 *       1: { level: 1, lotteryProbabilities: {}, transitionProbabilities: {}, replayProbability: 0.16 },
 *       6: { level: 6, lotteryProbabilities: {}, transitionProbabilities: {}, replayProbability: 0.18 },
 *     },
 *     initialLevel: 1,
 *   });
 *   return <button onClick={() => setDifficulty(6)}>設定6</button>;
 * }
 * ```
 */
declare function useDifficulty(config: DifficultyPresetConfig): {
    currentLevel: number;
    currentConfig: DifficultyConfig;
    setDifficulty: (level: number) => void;
    _preset: DifficultyPreset;
};

/**
 * EventEmitter のイベント購読・発火を React コンポーネント内で管理するフック。
 * コンポーネントアンマウント時に自動購読解除を行う。
 *
 * @param emitter - イベントバスインスタンス
 * @returns emit関数とon関数を含むオブジェクト
 *
 * @example
 * ```tsx
 * const emitter = new EventEmitter();
 * function MyComponent() {
 *   const { emit, on } = useEvent(emitter);
 *   on<number>('win', (payout) => console.log('Win:', payout));
 *   return <button onClick={() => emit('spinStart')}>Spin</button>;
 * }
 * ```
 */
declare function useEvent(emitter: EventEmitter): {
    emit: <T = unknown>(event: string, payload?: T) => void;
    on: <T = unknown>(event: string, listener: (payload: T) => void) => void;
};

/**
 * アニメーションフェーズ。リールアニメーションの現在の状態を表す。
 *
 * - `idle` — 停止中
 * - `accelerating` — 加速中
 * - `spinning` — 定速回転中
 * - `decelerating` — 減速中
 */
type AnimationPhase = 'idle' | 'accelerating' | 'spinning' | 'decelerating';
/**
 * 3フェーズアニメーション制御（加速・定速回転・減速停止）を提供するコントローラー。
 * AnimationConfigによる回転速度、イージング関数、停止遅延時間の設定をサポートする。
 *
 * @example
 * ```ts
 * const controller = new AnimationController({ spinSpeed: 0.5, stopDelays: [0, 200, 400] }, 3);
 * controller.onSpinComplete(() => console.log('全リール停止'));
 * controller.startSpin();
 * await controller.stopReel(0, 5);
 * ```
 */
declare class AnimationController {
    private config;
    private phase;
    private spinCompleteCallbacks;
    private reelCount;
    private stoppedReels;
    constructor(config?: AnimationConfig, reelCount?: number);
    /**
     * 現在のアニメーションフェーズを取得する。
     *
     * @returns 現在のAnimationPhase
     */
    getPhase(): AnimationPhase;
    /**
     * 解決済みのアニメーション設定を取得する。
     *
     * @returns デフォルト値が適用された完全なAnimationConfig
     */
    getConfig(): Required<AnimationConfig>;
    /**
     * スピンアニメーションを開始する（加速 → 定速回転）。
     */
    startSpin(): void;
    /**
     * 指定リールを減速停止する。全リール停止時にonSpinCompleteコールバックを発火する。
     *
     * @param reelIndex - リールインデックス
     * @param _position - 停止位置
     * @returns 停止完了時に解決するPromise
     */
    stopReel(reelIndex: number, _position: number): Promise<void>;
    /**
     * 全リール停止完了時のコールバックを登録する。
     *
     * @param callback - 完了時に呼び出されるコールバック
     */
    onSpinComplete(callback: () => void): void;
    /**
     * 全リール停止完了時のコールバックを解除する。
     *
     * @param callback - 解除するコールバック
     */
    offSpinComplete(callback: () => void): void;
    private notifySpinComplete;
}

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
declare const ConfigSerializer: {
    /**
     * GameConfig を JSON 文字列にシリアライズする。
     *
     * @param config - シリアライズ対象のGameConfig
     * @returns JSON文字列
     */
    serialize(config: GameConfig): string;
    /**
     * JSON 文字列を GameConfig にデシリアライズする。
     *
     * @param json - デシリアライズ対象のJSON文字列
     * @returns パースされたGameConfig
     * @throws 不正な JSON の場合はパースエラー
     * @throws 必須フィールド欠落の場合はバリデーションエラー
     */
    deserialize(json: string): GameConfig;
    /**
     * 値が有効な GameConfig かどうかを検証する型ガード。
     *
     * @param config - 検証対象の値
     * @returns GameConfigとして有効な場合true
     */
    validate(config: unknown): config is GameConfig;
};

export { type AnimationConfig, AnimationController, type AnimationPhase, type BTConfig, type BetConfig, type BonusConfig, type BonusType, type CarryOverFlag, type ChanceConfig, ConfigSerializer, type CreditHistory, CreditManager, type CreditState, type DifficultyConfig, DifficultyPreset, type DifficultyPresetConfig, type EvaluateFromStopResultsOptions, EventEmitter, type ForceTransitionOptions, type GameConfig, GameCycleManager, type GameCycleManagerConfig, type GameEvent, type GameMode, GameModeManager, type GameModeManagerConfig, type GamePhase, type GameZone, InternalLottery, type InternalLotteryConfig, type ModeTransitionConfig, type NotificationConfig, NotificationManager, type NotificationPayload, type NotificationType, type PayTable, type PayTableEntry, type Payline, type PaylineResult, Reel, type ReelConfig, ReelController, type ReelControllerConfig, type ReelDirection, type ReelProps, type ReelStrip, type Replay, type SlipRange, SlotMachine, type SlotMachineProps, SpinCounter, SpinEngine, type SpinEngineConfig, type SpinResult, StopButton, type StopButtonProps, type StopResult, type StopTiming, Symbol, type SymbolDefinition, type SymbolProps, type ThresholdConfig, type ThresholdRange, ThresholdTrigger, type UseSlotMachineConfig, type WinPattern, type WinningRole, type WinningRoleDefinition, type WinningRoleType, type ZoneConfig, type ZoneIndicator, ZoneManager, type ZoneManagerConfig, type ZoneState, useCredit, useDifficulty, useEvent, useGameCycle, useGameMode, useGameZone, useNotification, useSlotMachine, useSoundEffect, useThresholdTrigger };
