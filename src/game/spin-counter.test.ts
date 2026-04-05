import { describe, it, expect, beforeEach } from 'vitest';
import { SpinCounter } from './spin-counter';
import type { CounterConfig } from './spin-counter';

const defaultConfigs: CounterConfig[] = [
  { name: 'normalCounter', targetGameMode: 'Normal', resetCondition: 'BonusMode' },
  { name: 'chanceCounter', targetGameMode: 'Chance', resetCondition: 'BonusMode' },
];

describe('SpinCounter', () => {
  let sc: SpinCounter;

  beforeEach(() => {
    sc = new SpinCounter(defaultConfigs);
  });

  describe('initialization', () => {
    it('should initialize all counters to 0', () => {
      expect(sc.get('normalCounter')).toBe(0);
      expect(sc.get('chanceCounter')).toBe(0);
    });

    it('should return 0 for unknown counter names', () => {
      expect(sc.get('unknown')).toBe(0);
    });

    it('should work with empty config', () => {
      const empty = new SpinCounter();
      expect(empty.getAll()).toEqual({});
    });
  });

  describe('increment', () => {
    it('should increment a counter by 1', () => {
      sc.increment('normalCounter');
      expect(sc.get('normalCounter')).toBe(1);
    });

    it('should increment independently per counter', () => {
      sc.increment('normalCounter');
      sc.increment('normalCounter');
      sc.increment('chanceCounter');
      expect(sc.get('normalCounter')).toBe(2);
      expect(sc.get('chanceCounter')).toBe(1);
    });

    it('should create counter if it does not exist', () => {
      sc.increment('newCounter');
      expect(sc.get('newCounter')).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset counter to 0', () => {
      sc.increment('normalCounter');
      sc.increment('normalCounter');
      sc.reset('normalCounter');
      expect(sc.get('normalCounter')).toBe(0);
    });

    it('should not affect other counters', () => {
      sc.increment('normalCounter');
      sc.increment('chanceCounter');
      sc.reset('normalCounter');
      expect(sc.get('normalCounter')).toBe(0);
      expect(sc.get('chanceCounter')).toBe(1);
    });
  });

  describe('getAll', () => {
    it('should return all counters as a record', () => {
      sc.increment('normalCounter');
      sc.increment('chanceCounter');
      sc.increment('chanceCounter');
      expect(sc.getAll()).toEqual({
        normalCounter: 1,
        chanceCounter: 2,
      });
    });
  });

  describe('getConfig', () => {
    it('should return config for a known counter', () => {
      const config = sc.getConfig('normalCounter');
      expect(config).toEqual({
        name: 'normalCounter',
        targetGameMode: 'Normal',
        resetCondition: 'BonusMode',
      });
    });

    it('should return undefined for unknown counter', () => {
      expect(sc.getConfig('unknown')).toBeUndefined();
    });
  });

  describe('checkResetCondition', () => {
    it('should reset counters matching the condition', () => {
      sc.increment('normalCounter');
      sc.increment('normalCounter');
      sc.increment('chanceCounter');
      const reset = sc.checkResetCondition('BonusMode');
      expect(reset).toContain('normalCounter');
      expect(reset).toContain('chanceCounter');
      expect(sc.get('normalCounter')).toBe(0);
      expect(sc.get('chanceCounter')).toBe(0);
    });

    it('should not reset counters with different conditions', () => {
      const configs: CounterConfig[] = [
        { name: 'a', targetGameMode: 'Normal', resetCondition: 'BonusMode' },
        { name: 'b', targetGameMode: 'Chance', resetCondition: 'BTMode' },
      ];
      const counter = new SpinCounter(configs);
      counter.increment('a');
      counter.increment('b');
      const reset = counter.checkResetCondition('BonusMode');
      expect(reset).toEqual(['a']);
      expect(counter.get('a')).toBe(0);
      expect(counter.get('b')).toBe(1);
    });

    it('should return empty array when no counters match', () => {
      sc.increment('normalCounter');
      const reset = sc.checkResetCondition('NoMatch');
      expect(reset).toEqual([]);
      expect(sc.get('normalCounter')).toBe(1);
    });
  });
});
