import type {
  GameMode,
  BonusType,
  WinningRoleType,
  WinningRole,
  WinningRoleDefinition,
  CarryOverFlag,
} from '../types';

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
export interface InternalLotteryConfig {
  /** GameMode別・WinningRoleType別の当選確率 */
  probabilities: Record<GameMode, Record<string, number>>;
  /** 小役定義 */
  winningRoleDefinitions: WinningRoleDefinition[];
  /** カスタム乱数生成関数 */
  randomFn?: () => number;
}

/** デフォルト小役プリセット */
const DEFAULT_ROLE_DEFINITIONS: WinningRoleDefinition[] = [
  {
    id: 'cherry',
    name: 'チェリー',
    type: 'SMALL_WIN',
    payout: 2,
    patterns: [['cherry', 'ANY', 'ANY']],
    priority: 10,
  },
  {
    id: 'watermelon',
    name: 'スイカ',
    type: 'SMALL_WIN',
    payout: 6,
    patterns: [['watermelon', 'watermelon', 'watermelon']],
    priority: 20,
  },
  {
    id: 'bell',
    name: 'ベル',
    type: 'SMALL_WIN',
    payout: 8,
    patterns: [['bell', 'bell', 'bell']],
    priority: 30,
  },
  {
    id: 'replay',
    name: 'リプレイ',
    type: 'REPLAY',
    payout: 0,
    patterns: [['replay', 'replay', 'replay']],
    priority: 5,
  },
  {
    id: 'super_big_bonus',
    name: 'SUPER BIG BONUS',
    type: 'BONUS',
    payout: 0,
    patterns: [['seven', 'seven', 'seven']],
    priority: 100,
  },
  {
    id: 'big_bonus',
    name: 'BIG BONUS',
    type: 'BONUS',
    payout: 0,
    patterns: [['bar', 'bar', 'bar']],
    priority: 90,
  },
  {
    id: 'reg_bonus',
    name: 'REG BONUS',
    type: 'BONUS',
    payout: 0,
    patterns: [['seven', 'seven', 'bar']],
    priority: 80,
  },
];

/** BONUS種別とデフォルト小役IDのマッピング */
const BONUS_ID_TO_TYPE: Record<string, BonusType> = {
  super_big_bonus: 'SUPER_BIG_BONUS',
  big_bonus: 'BIG_BONUS',
  reg_bonus: 'REG_BONUS',
};

/**
 * WinningRoleDefinition を WinningRole に変換する
 */
function definitionToRole(def: WinningRoleDefinition, bonusType?: BonusType): WinningRole {
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    bonusType,
    payout: def.payout,
    patterns: def.patterns,
    priority: def.priority,
  };
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
export class InternalLottery {
  private readonly probabilities: Record<GameMode, Record<string, number>>;
  private readonly roleDefinitions: WinningRoleDefinition[];
  private readonly roleMap: Map<string, WinningRoleDefinition>;
  private readonly randomFn: () => number;
  private carryOver: CarryOverFlag | null = null;

  constructor(config: InternalLotteryConfig) {
    const definitions =
      config.winningRoleDefinitions.length > 0
        ? config.winningRoleDefinitions
        : DEFAULT_ROLE_DEFINITIONS;

    this.validateDefinitions(definitions);
    this.validateProbabilities(config.probabilities);

    this.probabilities = config.probabilities;
    this.roleDefinitions = definitions;
    this.randomFn = config.randomFn ?? Math.random;

    this.roleMap = new Map();
    for (const def of this.roleDefinitions) {
      this.roleMap.set(def.id, def);
    }
  }

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
  draw(gameMode: GameMode, _difficultyLevel?: number, excludeRoleIds?: string[]): WinningRole {
    // 持ち越し中のボーナスがある場合は優先返却
    if (this.carryOver !== null) {
      const carried = this.carryOver.winningRole;
      this.carryOver = { ...this.carryOver, gameCount: this.carryOver.gameCount + 1 };
      return carried;
    }

    const modeProbabilities = this.probabilities[gameMode];
    if (!modeProbabilities) {
      return MISS_ROLE;
    }

    const roll = this.randomFn();
    let cumulative = 0;

    // 確率テーブルを走査して当選役を決定
    for (const [roleId, probability] of Object.entries(modeProbabilities)) {
      // BET額制限: 除外対象の当選役はスキップ
      if (excludeRoleIds && excludeRoleIds.includes(roleId)) {
        continue;
      }
      cumulative += probability;
      if (roll < cumulative) {
        // roleId に対応する定義を検索
        const def = this.roleMap.get(roleId);
        if (def) {
          const bonusType = def.type === 'BONUS' ? this.resolveBonusType(roleId) : undefined;
          return definitionToRole(def, bonusType);
        }

        // 定義にない場合は WinningRoleType として解釈を試みる
        return this.resolveByType(roleId);
      }
    }

    // どの確率にも当たらなかった場合は MISS
    return MISS_ROLE;
  }

  /**
   * CarryOverFlag を設定する。取りこぼし時にボーナス当選状態を持ち越す。
   *
   * @param winningRole - 持ち越す当選役
   */
  setCarryOver(winningRole: WinningRole): void {
    this.carryOver = {
      winningRole,
      gameCount: 0,
    };
  }

  /**
   * 現在の CarryOverFlag を取得する。
   *
   * @returns 持ち越しフラグ。持ち越し中でない場合はnull
   */
  getCarryOverFlag(): CarryOverFlag | null {
    return this.carryOver;
  }

  /**
   * CarryOverFlag をクリアする
   */
  clearCarryOver(): void {
    this.carryOver = null;
  }

  /**
   * BONUS 種別を解決する
   */
  private resolveBonusType(roleId: string): BonusType | undefined {
    const def = this.roleMap.get(roleId);
    if (def?.bonusType) {
      return def.bonusType;
    }
    return BONUS_ID_TO_TYPE[roleId];
  }

  /**
   * roleId を WinningRoleType として解釈し、WinningRole を生成する
   */
  private resolveByType(roleId: string): WinningRole {
    const typeMap: Record<string, WinningRoleType> = {
      BONUS: 'BONUS',
      SMALL_WIN: 'SMALL_WIN',
      REPLAY: 'REPLAY',
      MISS: 'MISS',
    };

    const type = typeMap[roleId];
    if (type) {
      // タイプに一致する最初の定義を探す
      const def = this.roleDefinitions.find((d) => d.type === type);
      if (def) {
        const bonusType = type === 'BONUS' ? this.resolveBonusType(def.id) : undefined;
        return definitionToRole(def, bonusType);
      }
      return { ...MISS_ROLE, id: roleId, type };
    }

    return MISS_ROLE;
  }

  /**
   * 小役定義のバリデーション
   */
  private validateDefinitions(definitions: WinningRoleDefinition[]): void {
    const ids = new Set<string>();

    for (const def of definitions) {
      // 重複 ID チェック
      if (ids.has(def.id)) {
        throw new Error(`Duplicate WinningRoleDefinition ID: "${def.id}"`);
      }
      ids.add(def.id);

      // 負の配当チェック
      if (def.payout < 0) {
        throw new Error(
          `Negative payout for WinningRoleDefinition "${def.id}": ${def.payout}`
        );
      }

      // 空の出目パターンチェック
      if (!def.patterns || def.patterns.length === 0) {
        throw new Error(
          `Empty patterns for WinningRoleDefinition "${def.id}"`
        );
      }
    }
  }

  /**
   * 確率設定のバリデーション
   */
  private validateProbabilities(
    probabilities: Record<GameMode, Record<string, number>>
  ): void {
    for (const [mode, probs] of Object.entries(probabilities)) {
      const sum = Object.values(probs).reduce((acc, p) => acc + p, 0);
      if (sum > 1 + 1e-10) {
        throw new Error(
          `Probability sum exceeds 1 for GameMode "${mode}": ${sum}`
        );
      }

      for (const [roleId, prob] of Object.entries(probs)) {
        if (prob < 0) {
          throw new Error(
            `Negative probability for "${roleId}" in GameMode "${mode}": ${prob}`
          );
        }
      }
    }
  }
}

/** デフォルト小役プリセットをエクスポート */
export { DEFAULT_ROLE_DEFINITIONS };
