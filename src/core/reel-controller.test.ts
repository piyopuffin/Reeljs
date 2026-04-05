import { describe, it, expect, vi } from 'vitest';
import { ReelController } from './reel-controller';
import type { ReelControllerConfig } from './reel-controller';
import type { WinningRole, StopResult } from '../types';

/** テスト用の基本ReelStrip（3リール） */
const basicStrips = [
  ['cherry', 'bell', 'seven', 'bar', 'watermelon', 'replay', 'bell', 'cherry'],
  ['bell', 'seven', 'cherry', 'replay', 'bar', 'watermelon', 'seven', 'bell'],
  ['seven', 'bar', 'bell', 'cherry', 'replay', 'watermelon', 'bar', 'seven'],
];

function createBasicConfig(overrides?: Partial<ReelControllerConfig>): ReelControllerConfig {
  return {
    reelStrips: basicStrips,
    ...overrides,
  };
}

/** テスト用WinningRole */
const cherryRole: WinningRole = {
  id: 'cherry',
  name: 'チェリー',
  type: 'SMALL_WIN',
  payout: 2,
  patterns: [['cherry', 'ANY', 'ANY']],
  priority: 10,
};

const bellRole: WinningRole = {
  id: 'bell',
  name: 'ベル',
  type: 'SMALL_WIN',
  payout: 8,
  patterns: [['bell', 'bell', 'bell']],
  priority: 30,
};

const sevenRole: WinningRole = {
  id: 'super_big_bonus',
  name: 'SUPER BIG BONUS',
  type: 'BONUS',
  bonusType: 'SUPER_BIG_BONUS',
  payout: 0,
  patterns: [['seven', 'seven', 'seven']],
  priority: 100,
};

const missRole: WinningRole = {
  id: 'miss',
  name: 'ハズレ',
  type: 'MISS',
  payout: 0,
  patterns: [],
  priority: 0,
};

describe('ReelController', () => {
  describe('constructor', () => {
    it('should create an instance with valid config', () => {
      const controller = new ReelController(createBasicConfig());
      expect(controller).toBeInstanceOf(ReelController);
    });

    it('should use default SlipRange of 4', () => {
      const controller = new ReelController(createBasicConfig());
      // Verify by testing slip behavior — cherry at index 0, stopTiming 5
      // distance from 5 to next cherry at 7 is 2 (within default 4)
      const result = controller.determineStopPosition(0, cherryRole, 5);
      expect(result.isMiss).toBe(false);
      expect(result.actualPosition).toBe(7); // cherry at index 7
    });

    it('should accept custom SlipRanges', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [2, 2, 2],
      }));
      expect(controller).toBeInstanceOf(ReelController);
    });

    it('should accept custom stopOrder', () => {
      const controller = new ReelController(createBasicConfig({
        stopOrder: [2, 1, 0],
      }));
      expect(controller.getStopOrder()).toEqual([2, 1, 0]);
    });
  });

  describe('validation', () => {
    it('should throw on empty reelStrips array', () => {
      expect(() => new ReelController({ reelStrips: [] })).toThrow('ReelStrips must not be empty');
    });

    it('should throw on empty individual ReelStrip', () => {
      expect(() => new ReelController({ reelStrips: [['a'], [], ['b']] })).toThrow(
        'ReelStrip for reel 1 must not be empty'
      );
    });

    it('should throw on negative SlipRange', () => {
      expect(() => new ReelController(createBasicConfig({
        slipRanges: [4, -1, 4],
      }))).toThrow('SlipRange for reel 1 must not be negative');
    });

    it('should throw on out-of-range StopTiming', () => {
      const controller = new ReelController(createBasicConfig());
      expect(() => controller.determineStopPosition(0, missRole, -1)).toThrow(
        'out of range'
      );
      expect(() => controller.determineStopPosition(0, missRole, 8)).toThrow(
        'out of range'
      );
    });

    it('should throw on invalid reelIndex', () => {
      const controller = new ReelController(createBasicConfig());
      expect(() => controller.determineStopPosition(5, missRole, 0)).toThrow('Invalid reelIndex');
    });

    it('should throw on invalid stopOrder index', () => {
      expect(() => new ReelController(createBasicConfig({
        stopOrder: [0, 1, 5],
      }))).toThrow('StopOrder contains invalid reel index');
    });
  });

  describe('determineStopPosition — Slip (pull-in)', () => {
    it('should stop at exact position when target symbol is at stopTiming', () => {
      const controller = new ReelController(createBasicConfig());
      // Reel 0: index 0 = 'cherry'
      const result = controller.determineStopPosition(0, cherryRole, 0);
      expect(result.actualPosition).toBe(0);
      expect(result.slipCount).toBe(0);
      expect(result.isMiss).toBe(false);
    });

    it('should slip forward to target symbol within SlipRange', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [4, 4, 4],
      }));
      // Reel 0: ['cherry','bell','seven','bar','watermelon','replay','bell','cherry']
      // stopTiming=4 (watermelon), cherry is at index 7, distance=3 (within 4)
      const result = controller.determineStopPosition(0, cherryRole, 4);
      expect(result.actualPosition).toBe(7);
      expect(result.slipCount).toBe(3);
      expect(result.isMiss).toBe(false);
    });

    it('should handle circular wrap-around for slip', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [4, 4, 4],
      }));
      // Reel 0: ['cherry','bell','seven','bar','watermelon','replay','bell','cherry']
      // stopTiming=6 (bell), cherry at index 7, distance=1 (within 4)
      const result = controller.determineStopPosition(0, cherryRole, 6);
      expect(result.actualPosition).toBe(7);
      expect(result.slipCount).toBe(1);
      expect(result.isMiss).toBe(false);
    });

    it('should wrap around to beginning of strip', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [4, 4, 4],
      }));
      // Reel 0: ['cherry','bell','seven','bar','watermelon','replay','bell','cherry']
      // stopTiming=7 (cherry), cherry at index 7, distance=0
      const result = controller.determineStopPosition(0, cherryRole, 7);
      expect(result.actualPosition).toBe(7);
      expect(result.slipCount).toBe(0);
      expect(result.isMiss).toBe(false);
    });

    it('should respect SlipRange limit', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [1, 1, 1],
      }));
      // Reel 0: index 2='seven', index 3='bar' — cherry at 7 is far away
      // SlipRange=1, stopTiming=2, can only check index 2 and 3 — no cherry
      const result = controller.determineStopPosition(0, cherryRole, 2);
      expect(result.isMiss).toBe(true);
    });
  });

  describe('determineStopPosition — Reject (push-away)', () => {
    it('should reject to avoid showing target symbol on miss', () => {
      // When miss occurs, reject should find a non-target position
      const controller = new ReelController(createBasicConfig({
        slipRanges: [1, 1, 1],
      }));
      // Reel 0: stopTiming=2 (seven), SlipRange=1
      // cherry at 0 and 7 — neither within range [2,3]
      // Miss: reject should find non-cherry position within range
      const result = controller.determineStopPosition(0, cherryRole, 2);
      expect(result.isMiss).toBe(true);
      // actualPosition should not be a cherry position
      expect(basicStrips[0][result.actualPosition]).not.toBe('cherry');
    });
  });

  describe('determineStopPosition — Miss detection', () => {
    it('should mark as miss when target is beyond SlipRange', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [1, 1, 1],
      }));
      // Reel 0: stopTiming=3 (bar), SlipRange=1
      // Can check index 3 (bar) and 4 (watermelon) — no cherry
      const result = controller.determineStopPosition(0, cherryRole, 3);
      expect(result.isMiss).toBe(true);
      expect(result.targetPosition).toBe(3);
    });

    it('should not mark as miss for MISS winning role', () => {
      const controller = new ReelController(createBasicConfig());
      const result = controller.determineStopPosition(0, missRole, 3);
      expect(result.isMiss).toBe(false);
      expect(result.actualPosition).toBe(3);
    });
  });

  describe('determineStopPosition — multi-symbol patterns', () => {
    it('should find bell on each reel for bell role', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [4, 4, 4],
      }));
      // Reel 0: bell at index 1, stopTiming=0 → slip 1
      const r0 = controller.determineStopPosition(0, bellRole, 0);
      expect(r0.actualPosition).toBe(1);
      expect(r0.slipCount).toBe(1);
      expect(r0.isMiss).toBe(false);

      // Reel 1: bell at index 0, stopTiming=0 → slip 0
      const r1 = controller.determineStopPosition(1, bellRole, 0);
      expect(r1.actualPosition).toBe(0);
      expect(r1.slipCount).toBe(0);
      expect(r1.isMiss).toBe(false);

      // Reel 2: bell at index 2, stopTiming=0 → slip 2
      const r2 = controller.determineStopPosition(2, bellRole, 0);
      expect(r2.actualPosition).toBe(2);
      expect(r2.slipCount).toBe(2);
      expect(r2.isMiss).toBe(false);
    });
  });

  describe('AutoStop', () => {
    it('should auto-stop all reels with random timing', () => {
      let callCount = 0;
      const controller = new ReelController(createBasicConfig({
        autoStop: true,
        randomFn: () => {
          callCount++;
          return 0.0; // always pick index 0
        },
      }));
      expect(controller.isAutoStop).toBe(true);

      const results = controller.autoStopAll(missRole);
      expect(results).toHaveLength(3);
      expect(callCount).toBe(3);
      for (const r of results) {
        expect(r.actualPosition).toBe(0);
      }
    });

    it('should respect stopOrder during autoStop', () => {
      const controller = new ReelController(createBasicConfig({
        autoStop: true,
        stopOrder: [2, 0, 1],
        randomFn: () => 0.0,
      }));
      const results = controller.autoStopAll(missRole);
      expect(results[0].reelIndex).toBe(2);
      expect(results[1].reelIndex).toBe(0);
      expect(results[2].reelIndex).toBe(1);
    });

    it('should apply slip during autoStop when winning role matches', () => {
      const controller = new ReelController(createBasicConfig({
        autoStop: true,
        slipRanges: [4, 4, 4],
        randomFn: () => 0.0, // stopTiming = 0 for all reels
      }));
      // seven role: pattern ['seven','seven','seven']
      // Reel 0: seven at index 2, stopTiming=0, slip=2
      // Reel 1: seven at index 1, stopTiming=0, slip=1
      // Reel 2: seven at index 0, stopTiming=0, slip=0
      const results = controller.autoStopAll(sevenRole);
      expect(results[0].actualPosition).toBe(2); // reel 0
      expect(results[1].actualPosition).toBe(1); // reel 1
      expect(results[2].actualPosition).toBe(0); // reel 2
      for (const r of results) {
        expect(r.isMiss).toBe(false);
      }
    });
  });

  describe('stopOrder', () => {
    it('should default to left-to-right order', () => {
      const controller = new ReelController(createBasicConfig());
      expect(controller.getStopOrder()).toEqual([0, 1, 2]);
    });

    it('should allow custom stop order', () => {
      const controller = new ReelController(createBasicConfig({
        stopOrder: [1, 2, 0],
      }));
      expect(controller.getStopOrder()).toEqual([1, 2, 0]);
    });
  });

  describe('onStop callback', () => {
    it('should call registered callbacks on each stop', () => {
      const controller = new ReelController(createBasicConfig());
      const results: StopResult[] = [];
      controller.onStop((r) => results.push(r));

      controller.determineStopPosition(0, missRole, 0);
      controller.determineStopPosition(1, missRole, 0);

      expect(results).toHaveLength(2);
      expect(results[0].reelIndex).toBe(0);
      expect(results[1].reelIndex).toBe(1);
    });

    it('should support multiple callbacks', () => {
      const controller = new ReelController(createBasicConfig());
      let count1 = 0;
      let count2 = 0;
      controller.onStop(() => count1++);
      controller.onStop(() => count2++);

      controller.determineStopPosition(0, missRole, 0);
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    it('should pass correct StopResult to callback', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [4, 4, 4],
      }));
      const results: StopResult[] = [];
      controller.onStop((r) => results.push(r));

      // Reel 0: cherry at 0, stopTiming=0 → slip 0
      controller.determineStopPosition(0, cherryRole, 0);
      expect(results[0]).toEqual({
        reelIndex: 0,
        targetPosition: 0,
        actualPosition: 0,
        slipCount: 0,
        isMiss: false,
      });
    });
  });

  describe('carryOver setting', () => {
    it('should default to carryOverEnabled=false', () => {
      const controller = new ReelController(createBasicConfig());
      expect(controller.isCarryOverEnabled).toBe(false);
    });

    it('should accept carryOverEnabled=true', () => {
      const controller = new ReelController(createBasicConfig({
        carryOverEnabled: true,
      }));
      expect(controller.isCarryOverEnabled).toBe(true);
    });
  });

  describe('ReelStrip (circular list) management', () => {
    it('should return a copy of the ReelStrip', () => {
      const controller = new ReelController(createBasicConfig());
      const strip = controller.getReelStrip(0);
      expect(strip).toEqual(basicStrips[0]);
      // Modifying the copy should not affect the original
      strip[0] = 'modified';
      expect(controller.getReelStrip(0)[0]).toBe('cherry');
    });

    it('should throw for invalid reelIndex in getReelStrip', () => {
      const controller = new ReelController(createBasicConfig());
      expect(() => controller.getReelStrip(10)).toThrow('Invalid reelIndex');
    });

    it('should handle circular wrap in slip', () => {
      // Small strip to test wrap-around clearly
      const controller = new ReelController({
        reelStrips: [['a', 'b', 'c', 'target']],
        slipRanges: [4],
      });
      const role: WinningRole = {
        id: 'test',
        name: 'Test',
        type: 'SMALL_WIN',
        payout: 1,
        patterns: [['target']],
        priority: 1,
      };
      // stopTiming=2 (c), target at index 3, distance=1
      const result = controller.determineStopPosition(0, role, 2);
      expect(result.actualPosition).toBe(3);
      expect(result.slipCount).toBe(1);
      expect(result.isMiss).toBe(false);
    });

    it('should wrap around from end to beginning', () => {
      const controller = new ReelController({
        reelStrips: [['target', 'a', 'b', 'c']],
        slipRanges: [4],
      });
      const role: WinningRole = {
        id: 'test',
        name: 'Test',
        type: 'SMALL_WIN',
        payout: 1,
        patterns: [['target']],
        priority: 1,
      };
      // stopTiming=3 (c), target at index 0, circular distance=1
      const result = controller.determineStopPosition(0, role, 3);
      expect(result.actualPosition).toBe(0);
      expect(result.slipCount).toBe(1);
      expect(result.isMiss).toBe(false);
    });
  });

  describe('SlipRange=0', () => {
    it('should only match exact position with SlipRange=0', () => {
      const controller = new ReelController(createBasicConfig({
        slipRanges: [0, 0, 0],
      }));
      // Reel 0: index 0 = cherry → exact match
      const hit = controller.determineStopPosition(0, cherryRole, 0);
      expect(hit.isMiss).toBe(false);
      expect(hit.actualPosition).toBe(0);

      // Reel 0: index 1 = bell → miss
      const miss = controller.determineStopPosition(0, cherryRole, 1);
      expect(miss.isMiss).toBe(true);
    });
  });
});
