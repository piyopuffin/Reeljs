import React, { useMemo } from 'react';

/** リールの回転方向 */
export type ReelDirection = 'down' | 'up';

/**
 * 個別リールコンポーネントのprops。
 * @typeParam S - シンボルIDの文字列リテラル型
 */
export interface ReelProps<S extends string = string> {
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
  /** 1シンボルの高さpx（デフォルト: 60） */
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

export function Reel<S extends string = string>({
  symbols,
  spinning,
  stopPosition = 0,
  renderSymbol,
  rowCount = 3,
  symbolHeight = 60,
  spinDuration = 0.6,
  direction = 'down',
  className,
  style,
}: ReelProps<S>): React.ReactElement {
  const viewHeight = rowCount * symbolHeight;
  const stripLen = symbols.length;
  const oneLoopPx = stripLen * symbolHeight;

  // Always render the full strip x2 (for seamless loop).
  // Both spinning and stopped use the same DOM — only the style changes.
  const items = useMemo(() => {
    if (stripLen === 0) return [] as S[];
    return [...symbols, ...symbols];
  }, [symbols, stripLen]);

  const cls = [
    'reeljs-reel',
    spinning ? 'reeljs-reel--spinning' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  const animId = `rj-scroll-${stripLen}`;

  // When stopped, translate so that stopPosition is at the top of the viewport
  const stopOffset = -(stopPosition * symbolHeight);

  const trackStyle: React.CSSProperties = spinning
    ? {
        animation: `${animId} ${spinDuration}s linear infinite`,
        willChange: 'transform',
      }
    : {
        transform: `translateY(${stopOffset}px)`,
        transition: 'none',
      };

  return (
    <div
      className={cls}
      style={{ height: viewHeight, overflow: 'hidden', position: 'relative', ...style }}
      data-spinning={spinning}
    >
      {spinning && (
        <style>{`
@keyframes ${animId} {
  from { transform: translateY(${direction === 'down' ? -oneLoopPx : 0}px); }
  to   { transform: translateY(${direction === 'down' ? 0 : -oneLoopPx}px); }
}
        `}</style>
      )}
      <div
        className="reeljs-reel__track"
        style={{
          display: 'flex',
          flexDirection: 'column',
          ...trackStyle,
        }}
      >
        {items.map((sym, i) => (
          <div
            key={i}
            style={{
              height: symbolHeight,
              lineHeight: `${symbolHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#e0e0e0',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            {renderSymbol ? renderSymbol(sym) : <span>{sym}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
