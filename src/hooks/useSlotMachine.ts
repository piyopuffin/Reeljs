import { useState, useCallback, useRef } from 'react';
import type { GamePhase, SpinResult, BetConfig } from '../types';
import { SpinEngine } from '../core/spin-engine';
import type { SpinEngineConfig } from '../core/spin-engine';
import { CreditManager } from '../game/credit-manager';
import { GameCycleManager } from '../game/game-cycle-manager';
import type { GameCycleManagerConfig } from '../game/game-cycle-manager';

type SpinState = 'idle' | 'spinning' | 'stopped';

/**
 * useSlotMachineフックの設定。SpinEngine設定、クレジット設定、ゲームサイクル設定を含む。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 *
 * @example
 * ```ts
 * const config: UseSlotMachineConfig = {
 *   spinEngine: { reelConfigs: [...], payTable: { entries: [] }, paylines: [] },
 *   credit: { initialCredit: 1000, betOptions: [1, 2, 3], defaultBet: 3 },
 * };
 * ```
 */
export interface UseSlotMachineConfig<S extends string = string> {
  /** SpinEngineの設定 */
  spinEngine: SpinEngineConfig<S>;
  /** クレジット設定（省略時はクレジット管理なし） */
  credit?: BetConfig;
  /** ゲームサイクル設定（省略時はサイクル管理なし） */
  gameCycle?: GameCycleManagerConfig;
}

/**
 * メインフック。スピン状態・フェーズ・結果のリアクティブ管理を提供する。
 * CreditManager経由のクレジット確認・BET消費 → SpinEngine抽選 → Payout加算を統合実行する。
 *
 * @typeParam S - シンボルIDの文字列リテラル型
 * @param config - {@link UseSlotMachineConfig}
 * @returns スピン状態、フェーズ、結果、spin/reset関数
 *
 * @example
 * ```tsx
 * function SlotGame() {
 *   const { spinState, spinResult, spin, reset } = useSlotMachine({
 *     spinEngine: { reelConfigs, payTable, paylines },
 *     credit: { initialCredit: 1000, betOptions: [3], defaultBet: 3 },
 *   });
 *   return (
 *     <div>
 *       <p>状態: {spinState}</p>
 *       <button onClick={spin} disabled={spinState === 'spinning'}>Spin</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSlotMachine<S extends string = string>(config: UseSlotMachineConfig<S>) {
  const engineRef = useRef<SpinEngine<S>>(new SpinEngine<S>(config.spinEngine));
  const creditRef = useRef<CreditManager | null>(
    config.credit ? new CreditManager(config.credit) : null,
  );
  const cycleRef = useRef<GameCycleManager | null>(
    config.gameCycle ? new GameCycleManager(config.gameCycle) : null,
  );

  const engine = engineRef.current;
  const credit = creditRef.current;
  const cycle = cycleRef.current;

  const [spinState, setSpinState] = useState<SpinState>('idle');
  const [currentPhase, setCurrentPhase] = useState<GamePhase>(
    cycle?.currentPhase ?? 'WAITING',
  );
  const [spinResult, setSpinResult] = useState<SpinResult<S> | null>(null);

  // Register cycle phase change callback once
  const registeredRef = useRef(false);
  if (!registeredRef.current && cycle) {
    cycle.onPhaseChange((_from, to) => {
      setCurrentPhase(to);
    });
    registeredRef.current = true;
  }

  const spin = useCallback(() => {
    // Ignore if already spinning
    if (spinState === 'spinning') return;

    // Credit check & BET
    if (credit) {
      const success = credit.bet();
      if (!success) return; // Insufficient credits
    }

    setSpinState('spinning');

    // If cycle manager is provided, start cycle
    if (cycle) {
      cycle.startCycle();
    }

    // Execute spin
    const result = engine.spin();
    setSpinResult(result);
    setSpinState('stopped');

    // Payout
    if (credit && result.totalPayout > 0) {
      credit.payout(result.totalPayout);
    }
  }, [spinState, engine, credit, cycle]);

  const reset = useCallback(() => {
    setSpinState('idle');
    setSpinResult(null);
    setCurrentPhase(cycle?.currentPhase ?? 'WAITING');
  }, [cycle]);

  return {
    spinState,
    currentPhase,
    spinResult,
    spin,
    reset,
    _engine: engine,
    _credit: credit,
    _cycle: cycle,
  };
}
