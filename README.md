# Reeljs

[🇯🇵 日本語版はこちら](./README.ja.md)

A React library for building slot machine games with TypeScript.

## Installation

### From npm (not yet available)

> ⚠️ This package has not been published to npm yet.

```bash
npm install reeljs
# or
yarn add reeljs
```

### Local development

```bash
# Clone the repository
git clone https://github.com/your-username/reeljs.git
cd reeljs

# Install dependencies
npm install

# Build the library
npm run build

# Link locally for use in another project
npm link

# In your project directory
npm link reeljs
```

## Quick Start

```tsx
import { SlotMachine } from 'reeljs';

const symbols = [
  { id: 'cherry', name: 'Cherry', weight: 10 },
  { id: 'bell', name: 'Bell', weight: 8 },
  { id: 'bar', name: 'Bar', weight: 5 },
  { id: 'seven', name: 'Seven', weight: 2 },
];

function App() {
  return <SlotMachine symbols={symbols} reelCount={3} rowCount={3} />;
}
```

## TypeScript Usage

```tsx
import { useSlotMachine, type SpinResult } from 'reeljs';

type MySymbol = 'cherry' | 'bell' | 'bar' | 'seven';

function Game() {
  const { spinState, spinResult, spin, reset } = useSlotMachine<MySymbol>({
    spinEngine: {
      reelConfigs: [
        {
          symbols: [
            { id: 'cherry', name: 'Cherry', weight: 10 },
            { id: 'bell', name: 'Bell', weight: 8 },
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
      <p>State: {spinState}</p>
      <p>Payout: {spinResult?.totalPayout ?? 0}</p>
      <button onClick={spin} disabled={spinState === 'spinning'}>Spin</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## API Overview

### Components

| Component | Description |
|-----------|-------------|
| `SlotMachine` | Main container — renders reels and stop buttons |
| `Reel` | Single reel with scroll animation |
| `Symbol` | Individual symbol with custom rendering |
| `StopButton` | Per-reel stop button |

### Hooks

| Hook | Description |
|------|-------------|
| `useSlotMachine` | Core game state and spin control |
| `useCredit` | Credit balance and BET management |
| `useGameMode` | Mode transitions (Normal/Chance/Bonus/BT) |
| `useGameCycle` | Full game lifecycle phases |
| `useNotification` | Win notification timing |
| `useSoundEffect` | Event-driven sound playback |
| `useThresholdTrigger` | Spin counter and threshold actions |
| `useGameZone` | Zone management |
| `useDifficulty` | Difficulty preset control |
| `useEvent` | EventEmitter subscription |

### Core Modules

| Module | Description |
|--------|-------------|
| `SpinEngine` | Lottery → reel control → payline evaluation. Also provides `evaluateFromStopResults()` for building SpinResult from pre-determined StopResults |
| `InternalLottery` | Pre-spin winning role draw |
| `ReelController` | Slip/reject stop position control |
| `GameModeManager` | Mode transitions with `forceTransition()` for bypassing normal transition logic |
| `GameCycleManager` | 14-phase game lifecycle orchestrator |
| `CreditManager` | Credit balance operations |
| `ConfigSerializer` | JSON serialize/deserialize game config |

## Storybook

Interactive demos and documentation are available via Storybook:

```bash
npm run storybook
```

or

[Live Demo and Documents](https://piyopuffin.github.io/Reeljs)

## License

[MIT](./LICENSE)
