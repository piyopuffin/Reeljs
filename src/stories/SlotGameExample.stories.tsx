import React, { useState, useCallback, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Reel } from '../components/Reel';
import { SpinEngine } from '../core/spin-engine';
import { InternalLottery } from '../core/internal-lottery';
import type { SpinResult, ReelConfig, PayTable, Payline } from '../types';

// ── Symbol emoji mapping ──
const SYMBOL_EMOJI: Record<string, string> = {
  seven: '7️⃣',
  bar: '🎰',
  cherry: '🍒',
  bell: '🔔',
  watermelon: '🍉',
  replay: '🔄',
};

const renderSymbol = (id: string) => (
  <span style={{ fontSize: 32 }}>{SYMBOL_EMOJI[id] ?? id}</span>
);

// ── Game config ──
const REEL_STRIP = ['cherry', 'bell', 'bar', 'seven', 'watermelon', 'replay', 'bell', 'cherry', 'bar', 'seven'];

const REEL_CONFIGS: ReelConfig[] = Array.from({ length: 3 }, () => ({
  symbols: [
    { id: 'cherry', name: 'Cherry', weight: 10 },
    { id: 'bell', name: 'Bell', weight: 8 },
    { id: 'bar', name: 'Bar', weight: 5 },
    { id: 'seven', name: 'Seven', weight: 2 },
    { id: 'watermelon', name: 'Watermelon', weight: 4 },
    { id: 'replay', name: 'Replay', weight: 6 },
  ],
  reelStrip: REEL_STRIP,
}));

const PAY_TABLE: PayTable = {
  entries: [
    { pattern: ['seven', 'seven', 'seven'], payout: 100, roleType: 'BONUS' },
    { pattern: ['bar', 'bar', 'bar'], payout: 50, roleType: 'SMALL_WIN' },
    { pattern: ['bell', 'bell', 'bell'], payout: 15, roleType: 'SMALL_WIN' },
    { pattern: ['cherry', 'cherry', 'cherry'], payout: 10, roleType: 'SMALL_WIN' },
    { pattern: ['watermelon', 'watermelon', 'watermelon'], payout: 8, roleType: 'SMALL_WIN' },
    { pattern: ['replay', 'replay', 'replay'], payout: 0, roleType: 'REPLAY' },
  ],
};

const PAYLINES: Payline[] = [
  { index: 0, positions: [0, 0, 0] },
  { index: 1, positions: [1, 1, 1] },
  { index: 2, positions: [2, 2, 2] },
  { index: 3, positions: [0, 1, 2] },
  { index: 4, positions: [2, 1, 0] },
];

// ── Styles ──
const containerStyle: React.CSSProperties = {
  fontFamily: "'Segoe UI', sans-serif",
  background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  borderRadius: 16,
  padding: 32,
  maxWidth: 500,
  margin: '0 auto',
  color: '#fff',
};

const reelsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  background: '#000',
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
};

const infoBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 16,
  fontSize: 14,
  opacity: 0.9,
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px',
  fontSize: 18,
  fontWeight: 'bold',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const spinButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(180deg, #ff6b6b, #c0392b)',
  color: '#fff',
  width: '100%',
};

const betButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#333',
  color: '#fff',
  padding: '8px 16px',
  fontSize: 14,
};

const resultStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 12,
  borderRadius: 8,
  marginTop: 12,
  fontWeight: 'bold',
  fontSize: 16,
};

const stopBtnStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(180deg, #3498db, #2980b9)',
  color: '#fff',
  padding: '10px 0',
  fontSize: 14,
  width: 80,
};

// ── Main Demo Component ──

function SlotGameDemo() {
  const [credit, setCredit] = useState(1000);
  const [bet, setBet] = useState(3);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [stopPositions, setStopPositions] = useState([0, 0, 0]);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'stopping' | 'result'>('idle');
  const [message, setMessage] = useState('レバーを引いてスタート！');
  const [totalWin, setTotalWin] = useState(0);
  const [gameCount, setGameCount] = useState(0);
  const [stoppedCount, setStoppedCount] = useState(0);

  // Store the pending spin result so stop buttons can reveal it
  const pendingResultRef = useRef<SpinResult | null>(null);

  const engineRef = useRef(
    new SpinEngine({
      reelConfigs: REEL_CONFIGS,
      payTable: PAY_TABLE,
      paylines: PAYLINES,
    })
  );

  const lotteryRef = useRef(
    new InternalLottery({
      probabilities: {
        Normal: {
          cherry: 0.12,
          bell: 0.10,
          bar: 0.06,
          seven: 0.01,
          watermelon: 0.08,
          replay: 0.15,
        },
        Chance: {},
        Bonus: {},
        BT: {},
      },
      winningRoleDefinitions: [],
    })
  );

  // Spin handler — starts all reels, waits for manual stop
  const handleSpin = useCallback(() => {
    if (phase !== 'idle') return;
    if (credit < bet) {
      setMessage('クレジット不足！');
      return;
    }

    // BET
    setCredit((c) => c - bet);
    setResult(null);
    setGameCount((c) => c + 1);
    setStoppedCount(0);

    // Internal lottery + spin (result is pre-determined)
    const winningRole = lotteryRef.current.draw('Normal');
    const spinResult = engineRef.current.spin(winningRole);
    pendingResultRef.current = spinResult;

    // Start all reels
    setSpinning([true, true, true]);
    setPhase('spinning');
    setMessage('ストップボタンで停止！');
  }, [phase, credit, bet]);

  // Stop a single reel
  const handleStop = useCallback((reelIndex: number) => {
    if (!spinning[reelIndex]) return;

    const spinResult = pendingResultRef.current;
    if (!spinResult) return;

    // Stop this reel
    setSpinning((prev) => {
      const next = [...prev];
      next[reelIndex] = false;
      return next;
    });
    setStopPositions((prev) => {
      const next = [...prev];
      next[reelIndex] = spinResult.stopResults[reelIndex]?.actualPosition ?? 0;
      return next;
    });

    const newStoppedCount = stoppedCount + 1;
    setStoppedCount(newStoppedCount);

    // All 3 reels stopped → show result
    if (newStoppedCount >= 3) {
      setTimeout(() => {
        setResult(spinResult);
        setPhase('result');

        if (spinResult.totalPayout > 0) {
          setCredit((c) => c + spinResult.totalPayout);
          setTotalWin((w) => w + spinResult.totalPayout);
          setMessage(`🎉 WIN! +${spinResult.totalPayout}枚`);
        } else if (spinResult.isReplay) {
          setMessage('🔄 リプレイ！');
        } else {
          setMessage('ハズレ...');
        }

        setTimeout(() => {
          setPhase('idle');
          setMessage('レバーを引いてスタート！');
          pendingResultRef.current = null;
        }, 1500);
      }, 200);
    }
  }, [spinning, stoppedCount]);

  const betOptions = [1, 2, 3];

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', margin: '0 0 20px', fontSize: 24 }}>
        🎰 Reeljs Demo
      </h2>

      {/* Info bar */}
      <div style={infoBarStyle}>
        <span>CREDIT: <strong>{credit}</strong></span>
        <span>GAME: <strong>{gameCount}</strong></span>
        <span>WIN: <strong>{totalWin}</strong></span>
      </div>

      {/* Reels */}
      <div style={reelsContainerStyle}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Reel
              symbols={REEL_STRIP}
              spinning={spinning[i]}
              stopPosition={stopPositions[i]}
              renderSymbol={renderSymbol}
              rowCount={3}
            />
            <button
              onClick={() => handleStop(i)}
              disabled={!spinning[i]}
              style={{
                ...stopBtnStyle,
                opacity: spinning[i] ? 1 : 0.3,
                cursor: spinning[i] ? 'pointer' : 'not-allowed',
              }}
              aria-label={`Stop reel ${i + 1}`}
            >
              STOP
            </button>
          </div>
        ))}
      </div>

      {/* Message */}
      <div
        style={{
          ...resultStyle,
          background: result?.totalPayout
            ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.2))'
            : 'rgba(255,255,255,0.05)',
          color: result?.totalPayout ? '#ffd700' : '#aaa',
        }}
      >
        {message}
      </div>

      {/* Result grid */}
      {result && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, opacity: 0.6 }}>
          {result.grid.map((row, r) => (
            <div key={r}>
              {row.map((sym, c) => (
                <span key={c} style={{ marginRight: 8 }}>
                  {SYMBOL_EMOJI[sym] ?? sym}
                </span>
              ))}
            </div>
          ))}
          {result.winLines.length > 0 && (
            <div style={{ marginTop: 4, color: '#ffd700' }}>
              当選ライン: {result.winLines.map((w) => `L${w.lineIndex}`).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* BET selection */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
        {betOptions.map((b) => (
          <button
            key={b}
            onClick={() => phase === 'idle' && setBet(b)}
            style={{
              ...betButtonStyle,
              background: bet === b ? '#c0392b' : '#333',
              opacity: phase === 'idle' ? 1 : 0.5,
            }}
          >
            {b} BET
          </button>
        ))}
      </div>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={phase !== 'idle' || credit < bet}
        style={{
          ...spinButtonStyle,
          opacity: phase === 'idle' && credit >= bet ? 1 : 0.5,
          cursor: phase === 'idle' && credit >= bet ? 'pointer' : 'not-allowed',
        }}
      >
        {phase === 'idle' ? '🎰 SPIN' : phase === 'spinning' ? 'ストップボタンで停止' : phase === 'result' ? '結果表示中...' : '...'}
      </button>

      {/* Pay table */}
      <div style={{ marginTop: 24, fontSize: 12, opacity: 0.6 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>配当表:</div>
        <div>7️⃣7️⃣7️⃣ = 100 | 🎰🎰🎰 = 50 | 🔔🔔🔔 = 15</div>
        <div>🍒🍒🍒 = 10 | 🍉🍉🍉 = 8 | 🔄🔄🔄 = Replay</div>
      </div>
    </div>
  );
}

// ── Storybook Meta ──

const meta = {
  title: 'Example/Slot Game',
} satisfies Meta;

export default meta;

export const FullDemo: StoryObj = {
  render: () => <SlotGameDemo />,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};
