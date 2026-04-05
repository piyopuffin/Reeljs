import React, { useCallback } from 'react';
import type { StopTiming } from '../types';

/**
 * ストップボタンコンポーネントのprops。
 *
 * @example
 * ```tsx
 * <StopButton reelIndex={0} disabled={false} onStop={(idx, timing) => console.log(idx, timing)} />
 * ```
 */
export interface StopButtonProps {
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
 * @param props - {@link StopButtonProps}
 * @returns ストップボタンのReact要素
 *
 * @example
 * ```tsx
 * <StopButton
 *   reelIndex={0}
 *   disabled={!spinning}
 *   onStop={(reelIndex, timing) => controller.notifyStop(reelIndex, timing)}
 *   aria-label="リール1停止"
 * />
 * ```
 */
export function StopButton({
  reelIndex,
  disabled = false,
  onStop,
  className,
  style,
  'aria-label': ariaLabel,
}: StopButtonProps): React.ReactElement {
  const handleClick = useCallback(() => {
    if (!disabled) {
      // StopTiming is the current timestamp as a simple timing indicator
      const timing: StopTiming = Date.now();
      onStop(reelIndex, timing);
    }
  }, [reelIndex, disabled, onStop]);

  const classNames = [
    'reeljs-stop-button',
    disabled ? 'reeljs-stop-button--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      style={style}
      disabled={disabled}
      onClick={handleClick}
      aria-label={ariaLabel ?? `Stop reel ${reelIndex + 1}`}
      type="button"
    >
      Stop
    </button>
  );
}
