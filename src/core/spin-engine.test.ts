import { describe, it, expect } from 'vitest';
import { SpinEngine } from './spin-engine';
import type { SpinEngineConfig } from './spin-engine';
import { InternalLottery } from './internal-lottery';
import { ReelController } from './reel-controller';
import type {
  ReelConfig,
  PayTable,
  Payline,
  WinningRole,
  SymbolDefinition,
} from '../types';

// --- Test helpers ---

type TestSymbol = 'cherry' | 'bell' | 'bar' | 'seven' | 'replay';

function createSymbols(): SymbolDefinition<TestSymbol>[] {
  return [
    { id: 'cherry', name: 'Cherry', weight: 3 },
    { id: 'bell', name: 'Bell', weight: 3 },
    { id: 'bar', name: 'Bar', weight: 2 },
    { id: 'seven', name: 'Seven', weight: 1 },
    { id: 'replay', name: 'Replay', weight: 1 },
  ];
}

function createReelStrip(): TestSymbol[] {
  return ['cherry', 'bell', 'bar', 'seven', 'replay', 'cherry', 'bell', 'bar', 'cherry', 'bell'];
}

function createReelConfigs(): ReelConfig<TestSymbol>[] {
  const symbols = createSymbols();
  const strip = createReelStrip();
  return [
    { symbols, reelStrip: strip },
    { symbols, reelStrip: strip },
    { symbols, reelStrip: strip },
  ];
}

function createPayTable(): PayTable<TestSymbol> {
  return {
    entries: [
      { pattern: ['seven', 'seven', 'seven'], payout: 100, roleType: 'BONUS' },
      { pattern: ['bar', 'bar', 'bar'], payout: 50, roleType: 'BONUS' },
      { pattern: ['bell', 'bell', 'bell'], payout: 8, roleType: 'SMALL_WIN' },
      { pattern: ['cherry', 'cherry', 'cherry'], payout: 4, roleType: 'SMALL_WIN' },
      { pattern: ['replay', 'replay', 'replay'], payout: 0, roleType: 'REPLAY' },
    ],
  };
}

/** Horizontal paylines for a 3x3 grid */
function createPaylines(): Payline[] {
  return [
    { index: 0, positions: [0, 0, 0] }, // top row
    { index: 1, positions: [1, 1, 1] }, // middle row
    { index: 2, positions: [2, 2, 2] }, // bottom row
    { index: 3, positions: [0, 1, 2] }, // diagonal top-left to bottom-right
    { index: 4, positions: [2, 1, 0] }, // diagonal bottom-left to top-right (V-shape)
  ];
}

function createConfig(overrides?: Partial<SpinEngineConfig<TestSymbol>>): SpinEngineConfig<TestSymbol> {
  return {
    reelConfigs: createReelConfigs(),
    payTable: createPayTable(),
    paylines: createPaylines(),
    ...overrides,
  };
}

const CHERRY_ROLE: WinningRole = {
  id: 'cherry',
  name: 'Cherry',
  type: 'SMALL_WIN',
  payout: 4,
  patterns: [['cherry', 'cherry', 'cherry']],
  priority: 10,
};

const MISS_ROLE: WinningRole = {
  id: 'miss',
  name: 'ハズレ',
  type: 'MISS',
  payout: 0,
  patterns: [],
  priority: 0,
};

const REPLAY_ROLE: WinningRole = {
  id: 'replay',
  name: 'Replay',
  type: 'REPLAY',
  payout: 0,
  patterns: [['replay', 'replay', 'replay']],
  priority: 5,
};

describe('SpinEngine', () => {
  describe('constructor', () => {
    it('should create an instance with valid config', () => {
      const engine = new SpinEngine(createConfig());
      expect(engine).toBeInstanceOf(SpinEngine);
    });

    it('should accept external InternalLottery instance', () => {
      const lottery = new InternalLottery({
        probabilities: { Normal: { cherry: 0.5 }, Chance: {}, Bonus: {}, BT: {} },
        winningRoleDefinitions: [],
      });
      const engine = new SpinEngine(createConfig({ internalLottery: lottery }));
      expect(engine).toBeInstanceOf(SpinEngine);
    });

    it('should accept external ReelController instance', () => {
      const rc = new ReelController({
        reelStrips: [createReelStrip(), createReelStrip(), createReelStrip()],
      });
      const engine = new SpinEngine(createConfig({ reelController: rc }));
      expect(engine).toBeInstanceOf(SpinEngine);
    });

    it('should accept custom randomFn', () => {
      let called = false;
      const engine = new SpinEngine(createConfig({
        randomFn: () => { called = true; return 0.5; },
      }));
      engine.spin(); // triggers random fallback
      expect(called).toBe(true);
    });
  });

  describe('validation', () => {
    it('should throw on empty reelConfigs', () => {
      expect(() => new SpinEngine({
        reelConfigs: [],
        payTable: createPayTable(),
        paylines: createPaylines(),
      })).toThrow('ReelConfigs must not be empty');
    });

    it('should throw on empty symbol list in a reel', () => {
      expect(() => new SpinEngine({
        reelConfigs: [{ symbols: [], reelStrip: createReelStrip() }],
        payTable: createPayTable(),
        paylines: createPaylines(),
      })).toThrow('empty symbol list');
    });

    it('should throw on empty reelStrip in a reel', () => {
      expect(() => new SpinEngine({
        reelConfigs: [{ symbols: createSymbols(), reelStrip: [] }],
        payTable: createPayTable(),
        paylines: createPaylines(),
      })).toThrow('empty reelStrip');
    });

    it('should throw on negative weight', () => {
      const badSymbols: SymbolDefinition<TestSymbol>[] = [
        { id: 'cherry', name: 'Cherry', weight: -1 },
      ];
      expect(() => new SpinEngine({
        reelConfigs: [{ symbols: badSymbols, reelStrip: createReelStrip() }],
        payTable: createPayTable(),
        paylines: createPaylines(),
      })).toThrow('Negative weight');
    });
  });

  describe('spin (integrated execution)', () => {
    it('should return a valid SpinResult with winningRole', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.5 }));
      // stopTimings pointing to index 0 (cherry) on all reels
      const result = engine.spin(CHERRY_ROLE, [0, 0, 0]);
      expect(result.grid).toBeDefined();
      expect(result.grid.length).toBe(3); // 3 rows
      expect(result.grid[0].length).toBe(3); // 3 reels
      expect(result.stopResults.length).toBe(3);
      expect(result.winningRole).toBe(CHERRY_ROLE);
    });

    it('should fallback to random when no winningRole is provided', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.1 }));
      const result = engine.spin();
      expect(result.grid.length).toBe(3);
      expect(result.winningRole.type).toBe('MISS');
      expect(result.stopResults.every((sr) => !sr.isMiss)).toBe(true);
    });

    it('should set isReplay when winningRole is REPLAY', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.5 }));
      const result = engine.spin(REPLAY_ROLE, [4, 4, 4]);
      expect(result.isReplay).toBe(true);
    });

    it('should not set isReplay for non-REPLAY roles', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.5 }));
      const result = engine.spin(CHERRY_ROLE, [0, 0, 0]);
      expect(result.isReplay).toBe(false);
    });

    it('should set isMiss when any reel has a miss', () => {
      // Use a strip where cherry is only at position 0, and slip range is 4
      // If we stop at position 6 (bell), cherry at 0 is far away => miss
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.5 }));
      // strip: cherry(0), bell(1), bar(2), seven(3), replay(4), cherry(5), bell(6), bar(7), cherry(8), bell(9)
      // stopTiming=6, slipRange=4 => checks 6,7,8,9,0 => cherry at 8 => slip success
      // Actually cherry IS within range. Let's use a role with a symbol not on the strip.
      const rareRole: WinningRole = {
        id: 'rare',
        name: 'Rare',
        type: 'SMALL_WIN',
        payout: 10,
        patterns: [['nonexistent', 'nonexistent', 'nonexistent']],
        priority: 50,
      };
      const result = engine.spin(rareRole, [0, 0, 0]);
      // 'nonexistent' is not on the strip, so all reels should miss
      expect(result.isMiss).toBe(true);
      expect(result.missedRole).toBe(rareRole);
    });

    it('should include missedRole when isMiss is true', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.5 }));
      const rareRole: WinningRole = {
        id: 'rare',
        name: 'Rare',
        type: 'SMALL_WIN',
        payout: 10,
        patterns: [['nonexistent', 'nonexistent', 'nonexistent']],
        priority: 50,
      };
      const result = engine.spin(rareRole, [0, 0, 0]);
      expect(result.missedRole).toBe(rareRole);
    });
  });

  describe('spin result grid dimensions', () => {
    it('should produce grid with correct dimensions (3 rows x N reels)', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.3 }));
      const result = engine.spin();
      expect(result.grid.length).toBe(3);
      for (const row of result.grid) {
        expect(row.length).toBe(3);
      }
    });

    it('should produce grid symbols from the reel strips', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.3 }));
      const result = engine.spin();
      const validSymbols = new Set(createReelStrip());
      for (const row of result.grid) {
        for (const sym of row) {
          expect(validSymbols.has(sym)).toBe(true);
        }
      }
    });
  });

  describe('lottery (delegate to InternalLottery)', () => {
    it('should throw when InternalLottery is not configured', () => {
      const engine = new SpinEngine(createConfig());
      expect(() => engine.lottery('Normal')).toThrow('InternalLottery is not configured');
    });

    it('should delegate to InternalLottery when configured', () => {
      const lottery = new InternalLottery({
        probabilities: { Normal: { cherry: 1.0 }, Chance: {}, Bonus: {}, BT: {} },
        winningRoleDefinitions: [],
        randomFn: () => 0.5,
      });
      const engine = new SpinEngine(createConfig({ internalLottery: lottery }));
      const result = engine.lottery('Normal');
      expect(result.id).toBe('cherry');
    });

    it('should pass difficulty to InternalLottery', () => {
      const lottery = new InternalLottery({
        probabilities: { Normal: { cherry: 1.0 }, Chance: {}, Bonus: {}, BT: {} },
        winningRoleDefinitions: [],
        randomFn: () => 0.5,
      });
      const engine = new SpinEngine(createConfig({ internalLottery: lottery }));
      // difficulty is passed through (currently unused by InternalLottery but accepted)
      const result = engine.lottery('Normal', 3);
      expect(result.id).toBe('cherry');
    });
  });

  describe('controlReels (delegate to ReelController)', () => {
    it('should return StopResult for each reel', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.5 }));
      const results = engine.controlReels(CHERRY_ROLE, [0, 0, 0]);
      expect(results.length).toBe(3);
      for (let i = 0; i < 3; i++) {
        expect(results[i].reelIndex).toBe(i);
      }
    });

    it('should use random timings when stopTimings not provided', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.0 }));
      const results = engine.controlReels(MISS_ROLE);
      expect(results.length).toBe(3);
      // With randomFn=0, timing should be 0 for all reels
      for (const r of results) {
        expect(r.targetPosition).toBe(0);
      }
    });
  });

  describe('evaluatePaylines', () => {
    it('should detect horizontal payline match', () => {
      const engine = new SpinEngine(createConfig());
      // grid[row][reel] - all cherries on top row
      const grid: TestSymbol[][] = [
        ['cherry', 'cherry', 'cherry'],
        ['bell', 'bar', 'seven'],
        ['replay', 'replay', 'bar'],
      ];
      const results = engine.evaluatePaylines(grid);
      const topRowWin = results.find((r) => r.lineIndex === 0);
      expect(topRowWin).toBeDefined();
      expect(topRowWin!.payout).toBe(4);
      expect(topRowWin!.matchedSymbols).toEqual(['cherry', 'cherry', 'cherry']);
    });

    it('should detect diagonal payline match', () => {
      const engine = new SpinEngine(createConfig());
      // Diagonal: positions [0,1,2] => grid[0][0], grid[1][1], grid[2][2]
      const grid: TestSymbol[][] = [
        ['seven', 'bar', 'cherry'],
        ['bell', 'seven', 'bar'],
        ['replay', 'cherry', 'seven'],
      ];
      const results = engine.evaluatePaylines(grid);
      const diagWin = results.find((r) => r.lineIndex === 3);
      expect(diagWin).toBeDefined();
      expect(diagWin!.payout).toBe(100); // seven-seven-seven
    });

    it('should detect V-shape payline match', () => {
      const engine = new SpinEngine(createConfig());
      // V-shape: positions [2,1,0] => grid[2][0], grid[1][1], grid[0][2]
      const grid: TestSymbol[][] = [
        ['cherry', 'bar', 'bell'],
        ['bar', 'bell', 'seven'],
        ['bell', 'cherry', 'replay'],
      ];
      const results = engine.evaluatePaylines(grid);
      const vWin = results.find((r) => r.lineIndex === 4);
      expect(vWin).toBeDefined();
      expect(vWin!.payout).toBe(8); // bell-bell-bell
    });

    it('should return empty array when no paylines match', () => {
      const engine = new SpinEngine(createConfig());
      const grid: TestSymbol[][] = [
        ['cherry', 'bell', 'bar'],
        ['seven', 'replay', 'cherry'],
        ['bar', 'cherry', 'bell'],
      ];
      const results = engine.evaluatePaylines(grid);
      expect(results.length).toBe(0);
    });

    it('should sum multiple payline wins', () => {
      const engine = new SpinEngine(createConfig());
      // All rows are cherry => 3 horizontal wins + possibly diagonals
      const grid: TestSymbol[][] = [
        ['cherry', 'cherry', 'cherry'],
        ['cherry', 'cherry', 'cherry'],
        ['cherry', 'cherry', 'cherry'],
      ];
      const results = engine.evaluatePaylines(grid);
      // All 5 paylines should match cherry-cherry-cherry (payout 4 each)
      expect(results.length).toBe(5);
      const totalPayout = results.reduce((sum, r) => sum + r.payout, 0);
      expect(totalPayout).toBe(20); // 5 * 4
    });
  });

  describe('totalPayout calculation', () => {
    it('should sum all payline payouts in SpinResult', () => {
      const engine = new SpinEngine(createConfig({ randomFn: () => 0.5 }));
      // Force a grid with all cherries by using a strip that starts with cherry
      // and stopping at position 0 with cherry role
      const result = engine.spin(CHERRY_ROLE, [0, 0, 0]);
      // The grid depends on slip behavior, but totalPayout should equal sum of winLines
      const expectedTotal = result.winLines.reduce((sum, wl) => sum + wl.payout, 0);
      expect(result.totalPayout).toBe(expectedTotal);
    });
  });

  describe('custom random function', () => {
    it('should use custom randomFn for random fallback', () => {
      const calls: number[] = [];
      const engine = new SpinEngine(createConfig({
        randomFn: () => {
          const val = 0.0;
          calls.push(val);
          return val;
        },
      }));
      engine.spin();
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('payline patterns', () => {
    it('should support ANY wildcard in PayTable patterns', () => {
      const payTable: PayTable<TestSymbol> = {
        entries: [
          { pattern: ['cherry' as TestSymbol, 'ANY' as TestSymbol, 'ANY' as TestSymbol], payout: 2, roleType: 'SMALL_WIN' },
        ],
      };
      const engine = new SpinEngine(createConfig({ payTable }));
      const grid: TestSymbol[][] = [
        ['cherry', 'bell', 'bar'],
        ['bar', 'seven', 'replay'],
        ['replay', 'cherry', 'bell'],
      ];
      const results = engine.evaluatePaylines(grid);
      // Top row: cherry, bell, bar => matches cherry, ANY, ANY
      const topWin = results.find((r) => r.lineIndex === 0);
      expect(topWin).toBeDefined();
      expect(topWin!.payout).toBe(2);
    });
  });
});
