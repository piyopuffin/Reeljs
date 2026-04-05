import type { AnimationConfig } from '../types';

/** Default animation configuration */
const DEFAULT_ANIMATION_CONFIG: Required<AnimationConfig> = {
  spinSpeed: 0.5,
  easing: 'ease-in-out',
  stopDelays: [0, 200, 400],
  accelerationDuration: 300,
  decelerationDuration: 500,
};

/**
 * アニメーションフェーズ。リールアニメーションの現在の状態を表す。
 *
 * - `idle` — 停止中
 * - `accelerating` — 加速中
 * - `spinning` — 定速回転中
 * - `decelerating` — 減速中
 */
export type AnimationPhase = 'idle' | 'accelerating' | 'spinning' | 'decelerating';

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
export class AnimationController {
  private config: Required<AnimationConfig>;
  private phase: AnimationPhase = 'idle';
  private spinCompleteCallbacks: (() => void)[] = [];
  private reelCount: number;
  private stoppedReels: Set<number> = new Set();

  constructor(config?: AnimationConfig, reelCount = 3) {
    this.config = { ...DEFAULT_ANIMATION_CONFIG, ...config };
    this.reelCount = reelCount;
  }

  /**
   * 現在のアニメーションフェーズを取得する。
   *
   * @returns 現在のAnimationPhase
   */
  getPhase(): AnimationPhase {
    return this.phase;
  }

  /**
   * 解決済みのアニメーション設定を取得する。
   *
   * @returns デフォルト値が適用された完全なAnimationConfig
   */
  getConfig(): Required<AnimationConfig> {
    return { ...this.config };
  }

  /**
   * スピンアニメーションを開始する（加速 → 定速回転）。
   */
  startSpin(): void {
    this.stoppedReels.clear();
    this.phase = 'accelerating';

    // Transition to constant speed after acceleration duration
    setTimeout(() => {
      if (this.phase === 'accelerating') {
        this.phase = 'spinning';
      }
    }, this.config.accelerationDuration);
  }

  /**
   * 指定リールを減速停止する。全リール停止時にonSpinCompleteコールバックを発火する。
   *
   * @param reelIndex - リールインデックス
   * @param _position - 停止位置
   * @returns 停止完了時に解決するPromise
   */
  async stopReel(reelIndex: number, _position: number): Promise<void> {
    const delay = this.config.stopDelays[reelIndex] ?? 0;

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.phase = 'decelerating';

        setTimeout(() => {
          this.stoppedReels.add(reelIndex);

          // Check if all reels have stopped
          if (this.stoppedReels.size >= this.reelCount) {
            this.phase = 'idle';
            this.notifySpinComplete();
          }

          resolve();
        }, this.config.decelerationDuration);
      }, delay);
    });
  }

  /**
   * 全リール停止完了時のコールバックを登録する。
   *
   * @param callback - 完了時に呼び出されるコールバック
   */
  onSpinComplete(callback: () => void): void {
    this.spinCompleteCallbacks.push(callback);
  }

  /**
   * 全リール停止完了時のコールバックを解除する。
   *
   * @param callback - 解除するコールバック
   */
  offSpinComplete(callback: () => void): void {
    this.spinCompleteCallbacks = this.spinCompleteCallbacks.filter((cb) => cb !== callback);
  }

  private notifySpinComplete(): void {
    for (const cb of this.spinCompleteCallbacks) {
      cb();
    }
  }
}
