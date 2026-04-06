import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SymbolDefinition, AnimationConfig, StopTiming } from '../types';
import { Reel } from './Reel';
import { StopButton } from './StopButton';
import { AnimationController } from '../infrastructure/animation-controller';

/**
 * メインコンテナコンポーネントのprops。リール群とストップボタンを統合表示する。
 */
export interface SlotMachineProps<S extends string = string> {
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
export function SlotMachine<S extends string = string>({
  reelCount = 3,
  rowCount = 3,
  symbols,
  renderSymbol,
  animationConfig,
  showStopButtons = true,
  children,
  className,
  style,
}: SlotMachineProps<S>): React.ReactElement {
  const [spinning, setSpinning] = useState<boolean[]>(() =>
    Array(reelCount).fill(false)
  );
  const [stopPositions, setStopPositions] = useState<number[]>(() =>
    Array(reelCount).fill(0)
  );

  const controllerRef = useRef<AnimationController>(
    new AnimationController(animationConfig, reelCount)
  );

  useEffect(() => {
    controllerRef.current = new AnimationController(animationConfig, reelCount);
  }, [animationConfig, reelCount]);

  const symbolIds = symbols.map((s) => s.id);

  const handleStop = useCallback(
    (reelIndex: number, _timing: StopTiming) => {
      setSpinning((prev) => {
        const next = [...prev];
        next[reelIndex] = false;
        return next;
      });
      controllerRef.current.stopReel(reelIndex, stopPositions[reelIndex]);
    },
    [stopPositions]
  );

  const allStopped = spinning.every((s) => !s);

  const classNames = [
    'reeljs-slot-machine',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (children) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div className={classNames} style={style}>
      <div className="reeljs-slot-machine__reels">
        {Array.from({ length: reelCount }, (_, i) => (
          <Reel
            key={i}
            symbols={symbolIds}
            spinning={spinning[i]}
            stopPosition={stopPositions[i]}
            renderSymbol={renderSymbol}
            rowCount={rowCount}
          />
        ))}
      </div>
      {showStopButtons && (
        <div className="reeljs-slot-machine__buttons">
          {Array.from({ length: reelCount }, (_, i) => (
            <StopButton
              key={i}
              reelIndex={i}
              disabled={!spinning[i] || allStopped}
              onStop={handleStop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
