import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useSlotMachine } from '../hooks/useSlotMachine';
import { useCredit } from '../hooks/useCredit';
import { useGameMode } from '../hooks/useGameMode';

// ── useSlotMachine Demo ──

function SlotMachineDemo() {
  const { spinState, spinResult, spin, reset } = useSlotMachine({
    spinEngine: {
      reelConfigs: [
        { symbols: [{ id: 'cherry', name: 'Cherry', weight: 10 }, { id: 'bell', name: 'Bell', weight: 8 }], reelStrip: ['cherry', 'bell', 'cherry', 'bell'] },
        { symbols: [{ id: 'cherry', name: 'Cherry', weight: 10 }, { id: 'bell', name: 'Bell', weight: 8 }], reelStrip: ['cherry', 'bell', 'cherry', 'bell'] },
        { symbols: [{ id: 'cherry', name: 'Cherry', weight: 10 }, { id: 'bell', name: 'Bell', weight: 8 }], reelStrip: ['cherry', 'bell', 'cherry', 'bell'] },
      ],
      payTable: { entries: [{ pattern: ['cherry', 'cherry', 'cherry'], payout: 50, roleType: 'SMALL_WIN' as const }] },
      paylines: [{ index: 0, positions: [0, 0, 0] }],
    },
  });

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <h3>useSlotMachine</h3>
      <p>State: <strong>{spinState}</strong></p>
      <p>Payout: {spinResult?.totalPayout ?? '-'}</p>
      <button onClick={spin} disabled={spinState === 'spinning'}>Spin</button>{' '}
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// ── useCredit Demo ──

function CreditDemo() {
  const { balance, currentBet, canSpin, betOptions, setBet, deposit, withdraw } = useCredit({
    initialCredit: 1000,
    betOptions: [1, 2, 3],
    defaultBet: 1,
  });

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <h3>useCredit</h3>
      <p>Balance: <strong>{balance}</strong></p>
      <p>Current Bet: {currentBet}</p>
      <p>Can Spin: {canSpin ? 'Yes' : 'No'}</p>
      <div>
        {betOptions.map((b) => (
          <button key={b} onClick={() => setBet(b)} style={{ marginRight: 4 }}>
            Bet {b}
          </button>
        ))}
      </div>
      <button onClick={() => deposit(100)}>Deposit 100</button>{' '}
      <button onClick={() => withdraw(100)}>Withdraw 100</button>
    </div>
  );
}

// ── useGameMode Demo ──

function GameModeDemo() {
  const { currentMode, currentBonusType, remainingSpins } = useGameMode({
    transitionConfig: { normalToChance: 0.02, chanceTobt: 0.3, btToSuperBigBonus: 0.1 },
    bonusConfigs: {
      SUPER_BIG_BONUS: { type: 'SUPER_BIG_BONUS', payoutMultiplier: 3, maxSpins: 30, maxPayout: 500 },
      BIG_BONUS: { type: 'BIG_BONUS', payoutMultiplier: 2, maxSpins: 20, maxPayout: 300 },
      REG_BONUS: { type: 'REG_BONUS', payoutMultiplier: 1.5, maxSpins: 10, maxPayout: 150 },
    },
    btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [] },
    chanceConfig: { maxSpins: 20, maxPayout: 200, winPatterns: [] },
  });

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <h3>useGameMode</h3>
      <p>Mode: <strong>{currentMode}</strong></p>
      <p>Bonus Type: {currentBonusType ?? 'N/A'}</p>
      <p>Remaining Spins: {remainingSpins ?? 'N/A'}</p>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Hooks/Examples',
} satisfies Meta;

export default meta;

export const UseSlotMachineExample: StoryObj = {
  render: () => <SlotMachineDemo />,
};

export const UseCreditExample: StoryObj = {
  render: () => <CreditDemo />,
};

export const UseGameModeExample: StoryObj = {
  render: () => <GameModeDemo />,
};
