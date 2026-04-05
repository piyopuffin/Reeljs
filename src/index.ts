// Reeljs - React Slot Machine Library

// ── UI Components ──
export { SlotMachine, type SlotMachineProps } from './components/SlotMachine';
export { Reel, type ReelProps, type ReelDirection } from './components/Reel';
export { Symbol, type SymbolProps } from './components/Symbol';
export { StopButton, type StopButtonProps } from './components/StopButton';

// ── React Hooks ──
export { useSlotMachine, type UseSlotMachineConfig } from './hooks/useSlotMachine';
export { useGameMode } from './hooks/useGameMode';
export { useGameCycle } from './hooks/useGameCycle';
export { useGameZone } from './hooks/useGameZone';
export { useCredit } from './hooks/useCredit';
export { useNotification } from './hooks/useNotification';
export { useSoundEffect } from './hooks/useSoundEffect';
export { useThresholdTrigger } from './hooks/useThresholdTrigger';
export { useDifficulty } from './hooks/useDifficulty';
export { useEvent } from './hooks/useEvent';

// ── Core Engine ──
export { SpinEngine, type SpinEngineConfig } from './core/spin-engine';
export { InternalLottery, type InternalLotteryConfig } from './core/internal-lottery';
export { ReelController, type ReelControllerConfig } from './core/reel-controller';

// ── Game Management ──
export { GameCycleManager, type GameCycleManagerConfig } from './game/game-cycle-manager';
export { GameModeManager, type GameModeManagerConfig } from './game/game-mode-manager';
export { ZoneManager, type ZoneManagerConfig } from './game/zone-manager';
export { CreditManager } from './game/credit-manager';
export { NotificationManager } from './game/notification-manager';
export { SpinCounter } from './game/spin-counter';
export { ThresholdTrigger } from './game/threshold-trigger';
export { DifficultyPreset } from './game/difficulty-preset';

// ── Infrastructure ──
export { EventEmitter } from './infrastructure/event-emitter';
export { AnimationController, type AnimationPhase } from './infrastructure/animation-controller';

// ── Utilities ──
export { ConfigSerializer } from './utils/config-serializer';

// ── Types ──
export type {
  SymbolDefinition,
  ReelConfig,
  ReelStrip,
  SpinResult,
  StopResult,
  StopTiming,
  SlipRange,
  PaylineResult,
  Payline,
  PayTable,
  PayTableEntry,
  GameMode,
  BonusType,
  WinningRoleType,
  WinningRole,
  WinningRoleDefinition,
  CarryOverFlag,
  ModeTransitionConfig,
  BonusConfig,
  BTConfig,
  ChanceConfig,
  WinPattern,
  GamePhase,
  Replay,
  NotificationType,
  NotificationPayload,
  NotificationConfig,
  GameZone,
  ZoneConfig,
  ZoneState,
  ZoneIndicator,
  BetConfig,
  CreditHistory,
  CreditState,
  ThresholdConfig,
  ThresholdRange,
  DifficultyConfig,
  DifficultyPresetConfig,
  AnimationConfig,
  GameEvent,
  GameConfig,
} from './types';
