import React, { useMemo } from 'react';

/** リールの回転方向 */
export type ReelDirection = 'down' | 'up';

/**
 * 個別リールコンポーネントのprops。
 *
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

  // Build symbol list
  const items = useMemo(() => {
    if (stripLen === 0) return [] as S[];
    if (!spinning) {
      // Stopped: show rowCount symbols from stopPosition
      const out: S[] = [];
      for (let i = 0; i < rowCount; i++) {
        out.push(symbols[(stopPosition + i) % stripLen]);
      }
      return out;
    }
    // Spinning: duplicate strip twice for seamless loop
    return [...symbols, ...symbols];
  }, [symbols, spinning, stopPosition, rowCount, stripLen]);

  const cls = [
    'reeljs-reel',
    spinning ? 'reeljs-reel--spinning' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  // Unique animation name to avoid conflicts
  const animId = `rj-scroll-${stripLen}`;
  const endY = direction === 'down' ? oneLoopPx : -oneLoopPx;

  return (
    <div className={cls} style={{ height: viewHeight, overflow: 'hidden', ...style }} data-spinning={spinning}>
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
        style={spinning ? {
          display: 'flex',
          flexDirection: 'column',
          animation: `${animId} ${spinDuration}s linear infinite`,
          willChange: 'transform',
        } : {
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {items.map((sym, i) => (
          <div
            key={`${spinning ? 's' : 'p'}-${i}`}
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
