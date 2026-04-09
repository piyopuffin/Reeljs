# Reeljs

[🇬🇧 English version](./README.md)

Reactでスロットゲームを構築するためのTypeScriptライブラリです。

## インストール

### npm から（未公開）

> ⚠️ このパッケージはまだnpmに公開されていません。「ローカルで利用する」の方法でご利用ください。

```bash
npm install reeljs
# or
yarn add reeljs
```

### ローカルで利用する

```bash
# リポジトリをクローン
git clone https://github.com/your-username/reeljs.git
cd reeljs

# 依存関係をインストール
npm install

# ライブラリをビルド
npm run build

# ローカルリンク
npm link

# 利用するプロジェクトのディレクトリで
npm link reeljs
```

## クイックスタート

```tsx
import { SlotMachine } from 'reeljs';

const symbols = [
  { id: 'cherry', name: 'チェリー', weight: 10 },
  { id: 'bell', name: 'ベル', weight: 8 },
  { id: 'bar', name: 'BAR', weight: 5 },
  { id: 'seven', name: 'セブン', weight: 2 },
];

function App() {
  return <SlotMachine symbols={symbols} reelCount={3} rowCount={3} />;
}
```

## TypeScriptでの使用例

```tsx
import { useSlotMachine, type SpinResult } from 'reeljs';

type MySymbol = 'cherry' | 'bell' | 'bar' | 'seven';

function Game() {
  const { spinState, spinResult, spin, reset } = useSlotMachine<MySymbol>({
    spinEngine: {
      reelConfigs: [
        {
          symbols: [
            { id: 'cherry', name: 'チェリー', weight: 10 },
            { id: 'bell', name: 'ベル', weight: 8 },
          ],
          reelStrip: ['cherry', 'bell', 'cherry', 'bell'],
        },
      ],
      payTable: {
        entries: [
          { pattern: ['cherry', 'cherry', 'cherry'], payout: 50, roleType: 'SMALL_WIN' },
        ],
      },
      paylines: [{ index: 0, positions: [0, 0, 0] }],
    },
    credit: { initialCredit: 1000, betOptions: [1, 2, 3], defaultBet: 1 },
  });

  return (
    <div>
      <p>状態: {spinState}</p>
      <p>配当: {spinResult?.totalPayout ?? 0}</p>
      <button onClick={spin} disabled={spinState === 'spinning'}>スピン</button>
      <button onClick={reset}>リセット</button>
    </div>
  );
}
```

## API一覧

### コンポーネント

| コンポーネント | 説明 |
|------------|------|
| `SlotMachine` | メインコンテナ — リールとストップボタンを表示 |
| `Reel` | スクロールアニメーション付きの個別リール |
| `Symbol` | カスタムレンダリング対応の個別シンボル |
| `StopButton` | リールごとのストップボタン |

### フック

| フック | 説明 |
|-------|------|
| `useSlotMachine` | ゲーム状態とスピン制御 |
| `useCredit` | クレジット残高・BET管理 |
| `useGameMode` | モード遷移（通常/チャンス/ボーナス/BT） |
| `useGameCycle` | ゲームサイクル全14フェーズ管理 |
| `useNotification` | 当選告知タイミング制御 |
| `useSoundEffect` | イベント駆動のサウンド再生 |
| `useThresholdTrigger` | スピンカウンター・閾値トリガー |
| `useGameZone` | ゲームゾーン（区間）管理 |
| `useDifficulty` | 設定の切り替え |
| `useEvent` | EventEmitterの購読 |

### コアモジュール

| モジュール | 説明 |
|----------|------|
| `SpinEngine` | 内部抽選 → 出目制御 → Payline評価の統合ファサード。`evaluateFromStopResults()` で事前決定済みStopResultsからSpinResultを構築可能 |
| `InternalLottery` | レバーON時の当選役決定 |
| `ReelController` | 引き込み・蹴飛ばしによる停止位置制御 |
| `GameModeManager` | モード遷移管理。`forceTransition()` で確率判定をバイパスした強制遷移が可能 |
| `GameCycleManager` | 14フェーズのゲームサイクルオーケストレーター |
| `CreditManager` | クレジット残高操作 |
| `ConfigSerializer` | ゲーム設定のJSON シリアライズ/デシリアライズ |

## Storybook

インタラクティブなデモとドキュメントはStorybookで確認できます。

```bash
npm run storybook
```