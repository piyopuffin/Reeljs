import { useState, useCallback, useRef, useEffect } from 'react';
import type { GamePhase } from '../types';
import { GameCycleManager } from '../game/game-cycle-manager';
import type { GameCycleManagerConfig } from '../game/game-cycle-manager';

/**
 * GameCycleManager をラップし、ゲームサイクルのリアクティブ状態を提供するフック。
 * 現在のGamePhase、リプレイ状態をリアクティブに返却し、各フェーズへのコールバック登録を提供する。
 *
 * @param config - GameCycleManagerの設定（依存モジュール群）
 * @returns ゲームサイクル状態とアクション関数
 *
 * @example
 * ```tsx
 * function GameScreen() {
 *   const { currentPhase, isReplay, startCycle, onPhase } = useGameCycle({
 *     spinEngine: mySpinEngine,
 *     creditManager: myCreditManager,
 *   });
 *   onPhase('WIN_JUDGE', () => console.log('当選判定中'));
 *   return <button onClick={startCycle}>Start</button>;
 * }
 * ```
 */
export function useGameCycle(config: GameCycleManagerConfig) {
  const managerRef = useRef<GameCycleManager>(new GameCycleManager(config));
  const manager = managerRef.current;

  const [currentPhase, setCurrentPhase] = useState<GamePhase>(manager.currentPhase);
  const [isReplay, setIsReplay] = useState(manager.isReplay);

  const phaseCallbacksRef = useRef<Partial<Record<GamePhase, () => void>>>({});

  // Register phase change callback once
  const registeredRef = useRef(false);
  if (!registeredRef.current) {
    manager.onPhaseChange((_from, to) => {
      setCurrentPhase(to);
      setIsReplay(manager.isReplay);
      const cb = phaseCallbacksRef.current[to];
      if (cb) cb();
    });
    registeredRef.current = true;
  }

  const startCycle = useCallback(() => {
    manager.startCycle();
    setCurrentPhase(manager.currentPhase);
    setIsReplay(manager.isReplay);
  }, [manager]);

  const onPhase = useCallback((phase: GamePhase, callback: () => void) => {
    phaseCallbacksRef.current[phase] = callback;
  }, []);

  return {
    currentPhase,
    isReplay,
    startCycle,
    onPhase,
    _manager: manager,
  };
}
