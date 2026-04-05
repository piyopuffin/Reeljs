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
export interface AnimationConfig {
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
