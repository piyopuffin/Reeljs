import { useState, useCallback, useRef } from 'react';
import type { DifficultyConfig, DifficultyPresetConfig } from '../types';
import { DifficultyPreset } from '../game/difficulty-preset';

/**
 * DifficultyPreset をラップし、設定のリアクティブ管理を提供するフック。
 * 現在の設定とDifficultyConfigをリアクティブに返却する。
 *
 * @param config - 設定プリセット設定
 * @returns 設定状態とsetDifficulty関数
 *
 * @example
 * ```tsx
 * function DifficultySelector() {
 *   const { currentLevel, currentConfig, setDifficulty } = useDifficulty({
 *     levels: {
 *       1: { level: 1, lotteryProbabilities: {}, transitionProbabilities: {}, replayProbability: 0.16 },
 *       6: { level: 6, lotteryProbabilities: {}, transitionProbabilities: {}, replayProbability: 0.18 },
 *     },
 *     initialLevel: 1,
 *   });
 *   return <button onClick={() => setDifficulty(6)}>設定6</button>;
 * }
 * ```
 */
export function useDifficulty(config: DifficultyPresetConfig) {
  const presetRef = useRef<DifficultyPreset>(new DifficultyPreset(config));
  const preset = presetRef.current;

  const [currentLevel, setCurrentLevel] = useState(preset.currentLevel);
  const [currentConfig, setCurrentConfig] = useState<DifficultyConfig>(preset.currentConfig);

  const setDifficulty = useCallback(
    (level: number) => {
      preset.setDifficulty(level);
      setCurrentLevel(preset.currentLevel);
      setCurrentConfig(preset.currentConfig);
    },
    [preset],
  );

  return {
    currentLevel,
    currentConfig,
    setDifficulty,
    _preset: preset,
  };
}
