import { useState, useCallback, useRef } from 'react';
import type { GameMode, BonusType, SpinResult, WinningRole } from '../types';
import { GameModeManager } from '../game/game-mode-manager';
import type { GameModeManagerConfig } from '../game/game-mode-manager';

/**
 * GameModeManager をラップし、モード遷移のリアクティブ状態を提供するフック。
 * 現在のGameMode、BonusType、残りスピン数をリアクティブに返却する。
 *
 * @param config - GameModeManagerの設定（遷移確率、ボーナス設定等）
 * @returns モード状態とevaluateTransition関数
 *
 * @example
 * ```tsx
 * function ModeDisplay() {
 *   const { currentMode, currentBonusType, remainingSpins, evaluateTransition } = useGameMode({
 *     transitionConfig: { normalToChance: 0.02, chanceTobt: 0.3, btToSuperBigBonus: 0.1 },
 *     bonusConfigs: { ... },
 *     btConfig: { maxSpins: 50, maxPayout: 500, winPatterns: [] },
 *     chanceConfig: { maxSpins: 20, maxPayout: 200, winPatterns: [] },
 *   });
 *   return <p>Mode: {currentMode}</p>;
 * }
 * ```
 */
export function useGameMode(config: GameModeManagerConfig) {
  const managerRef = useRef<GameModeManager>(new GameModeManager(config));
  const manager = managerRef.current;

  const [currentMode, setCurrentMode] = useState<GameMode>(manager.currentMode);
  const [currentBonusType, setCurrentBonusType] = useState<BonusType | null>(manager.currentBonusType);
  const [remainingSpins, setRemainingSpins] = useState<number | null>(manager.getRemainingSpins());

  // Register mode change callback once
  const registeredRef = useRef(false);
  if (!registeredRef.current) {
    manager.onModeChange(() => {
      setCurrentMode(manager.currentMode);
      setCurrentBonusType(manager.currentBonusType);
      setRemainingSpins(manager.getRemainingSpins());
    });
    registeredRef.current = true;
  }

  const evaluateTransition = useCallback(
    (spinResult: SpinResult, winningRole: WinningRole) => {
      manager.evaluateTransition(spinResult, winningRole);
      setCurrentMode(manager.currentMode);
      setCurrentBonusType(manager.currentBonusType);
      setRemainingSpins(manager.getRemainingSpins());
    },
    [manager],
  );

  return {
    currentMode,
    currentBonusType,
    remainingSpins,
    evaluateTransition,
    _manager: manager,
  };
}
