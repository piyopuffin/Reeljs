import React from 'react';
import { Symbol as SymbolComponent } from './Symbol';

/** リールの回転方向 */
export type ReelDirection = 'down' | 'up';

/**
 * 個別リールコンポーネントのprops。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```tsx
 * <Reel symbols={['cherry', 'bell', 'bar']} spinning={false} stopPosition={0} />
 * ```
 */
export interface ReelProps<S extends string = string> {
  /** シンボルリスト */
  symbols: S[];
  /** スピン状態。trueの場合スクロールアニメーションを表示する */
  spinning: boolean;
  /** 停止位置インデックス（デフォルト: 0） */
  stopPosition?: number;
  /** シンボルのカスタムレンダリング関数 */
  renderSymbol?: (symbolId: S) => React.ReactNode;
  /** 表示行数（デフォルト: 3） */
  rowCount?: number;
  /** 回転方向（デフォルト: 'down' — 上から下へ流れる） */
  direction?: ReelDirection;
  /** CSSクラス名 */
  className?: string;
  /** インラインスタイル */
  style?: React.CSSProperties;
}

/**
 * 個別リールコンポーネント。シンボルの縦方向表示とスクロールアニメーションを提供する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 * @param props - {@link ReelProps}
 * @returns リールのReact要素
 *
 * @example
 * ```tsx
 * <Reel
 *   symbols={['cherry', 'bell', 'bar', 'seven']}
 *   spinning={true}
 *   stopPosition={2}
 *   rowCount={3}
 * />
 * ```
 */
export function Reel<S extends string = string>({
  symbols,
  spinning,
  stopPosition = 0,
  renderSymbol,
  rowCount = 3,
  direction = 'down',
  className,
  style,
}: ReelProps<S>): React.ReactElement {
  const classNames = [
    'reeljs-reel',
    spinning ? 'reeljs-reel--spinning' : '',
    spinning && direction === 'up' ? 'reeljs-reel--spin-up' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // When spinning, show a longer strip of symbols for the scroll effect
  const displaySymbols: S[] = [];
  if (symbols.length > 0) {
    if (spinning) {
      // Show extra symbols for smooth scrolling illusion
      for (let i = 0; i < rowCount + 2; i++) {
        const idx = (stopPosition + i) % symbols.length;
        displaySymbols.push(symbols[idx]);
      }
    } else {
      for (let i = 0; i < rowCount; i++) {
        const idx = (stopPosition + i) % symbols.length;
        displaySymbols.push(symbols[idx]);
      }
    }
  }

  const reelHeight = rowCount * 60;

  return (
    <div
      className={classNames}
      style={{ height: reelHeight, ...style }}
      data-spinning={spinning}
    >
      <div className="reeljs-reel__track">
        {displaySymbols.map((symbolId, i) => (
          <SymbolComponent
            key={`${i}-${symbolId}`}
            symbolId={symbolId}
            renderSymbol={renderSymbol}
          />
        ))}
      </div>
    </div>
  );
}
