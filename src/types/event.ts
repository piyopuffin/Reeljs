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
export type GameEvent =
  | 'spinStart'
  | 'reelStop'
  | 'win'
  | 'bonusStart'
  | 'modeChange'
  | 'zoneChange'
  | 'phaseChange'
  | 'creditChange'
  | 'notification';
