import React from 'react';

/**
 * 個別シンボルコンポーネントのprops。
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
 * - `renderSymbol` を渡すとカスタム表示、省略時はシンボルIDのテキスト表示
 * - `highlighted` が true の場合、`reeljs-symbol--highlighted` CSSクラスが付与される
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
