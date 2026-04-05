import React from 'react';

/**
 * 個別シンボルコンポーネントのprops。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```tsx
 * <Symbol symbolId="cherry" highlighted={true} />
 * <Symbol symbolId="bell" renderSymbol={(id) => <img src={`/symbols/${id}.png`} />} />
 * ```
 */
export interface SymbolProps<S extends string = string> {
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
 * @typeParam S - シンボルIDの文字列リテラル型
 * @param props - {@link SymbolProps}
 * @returns シンボルのReact要素
 *
 * @example
 * ```tsx
 * // デフォルトテキスト表示
 * <Symbol symbolId="cherry" />
 *
 * // カスタムレンダリング
 * <Symbol symbolId="cherry" renderSymbol={(id) => <span>🍒</span>} highlighted />
 * ```
 */
export function Symbol<S extends string = string>({
  symbolId,
  renderSymbol,
  highlighted = false,
  className,
}: SymbolProps<S>): React.ReactElement {
  const classNames = [
    'reeljs-symbol',
    highlighted ? 'reeljs-symbol--highlighted' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} data-symbol-id={symbolId}>
      {renderSymbol ? renderSymbol(symbolId) : <span>{symbolId}</span>}
    </div>
  );
}
