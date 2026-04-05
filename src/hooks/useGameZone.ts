import { useState, useCallback, useRef } from 'react';
import type { ZoneConfig, ZoneIndicator, SpinResult } from '../types';
import { ZoneManager } from '../game/zone-manager';
import type { ZoneManagerConfig } from '../game/zone-manager';

/**
 * ZoneManager をラップし、ゾーン管理のリアクティブ状態を提供するフック。
 * 現在のゾーン、消化ゲーム数、差枚数、残りゲーム数等をリアクティブに返却する。
 *
 * @param config - ZoneManagerの設定（ゾーン定義、初期ゾーン）
 * @returns ゾーン状態とupdate関数
 *
 * @example
 * ```tsx
 * function ZoneDisplay() {
 *   const { currentZone, gamesPlayed, remainingGames, indicator, update } = useGameZone({
 *     zones: {
 *       normal: { name: '通常区間', maxGames: 1500, maxNetCredits: 2400, resetTargets: [], nextZone: 'special', isSpecial: false },
 *       special: { name: '特別区間', maxGames: 500, maxNetCredits: 1000, resetTargets: ['gameMode'], nextZone: 'normal', isSpecial: true },
 *     },
 *     initialZone: 'normal',
 *   });
 *   return <p>{indicator.zoneName}: 残り{remainingGames}G</p>;
 * }
 * ```
 */
export function useGameZone(config: ZoneManagerConfig) {
  const managerRef = useRef<ZoneManager>(new ZoneManager(config));
  const manager = managerRef.current;

  const [currentZone, setCurrentZone] = useState(manager.currentState.currentZone);
  const [gamesPlayed, setGamesPlayed] = useState(manager.currentState.gamesPlayed);
  const [netCredits, setNetCredits] = useState(manager.currentState.netCredits);
  const [indicator, setIndicator] = useState<ZoneIndicator>(manager.indicator);

  const zoneConfig = config.zones[currentZone];
  const remainingGames = zoneConfig ? zoneConfig.maxGames - gamesPlayed : 0;
  const remainingCredits = zoneConfig ? zoneConfig.maxNetCredits - netCredits : 0;

  const sync = useCallback(() => {
    const state = manager.currentState;
    setCurrentZone(state.currentZone);
    setGamesPlayed(state.gamesPlayed);
    setNetCredits(state.netCredits);
    setIndicator(manager.indicator);
  }, [manager]);

  // Register zone change callback once
  const registeredRef = useRef(false);
  if (!registeredRef.current) {
    manager.onZoneChange(() => {
      sync();
    });
    registeredRef.current = true;
  }

  const update = useCallback(
    (spinResult: SpinResult) => {
      manager.update(spinResult);
      sync();
    },
    [manager, sync],
  );

  return {
    currentZone,
    gamesPlayed,
    netCredits,
    indicator,
    remainingGames,
    remainingCredits,
    update,
    _manager: manager,
  };
}
