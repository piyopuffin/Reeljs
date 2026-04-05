import { describe, it, expect, vi } from 'vitest';
import { AnimationController } from './animation-controller';

describe('AnimationController', () => {
  it('starts in idle phase', () => {
    const controller = new AnimationController();
    expect(controller.getPhase()).toBe('idle');
  });

  it('transitions to accelerating on startSpin', () => {
    const controller = new AnimationController();
    controller.startSpin();
    expect(controller.getPhase()).toBe('accelerating');
  });

  it('transitions to spinning after acceleration duration', async () => {
    const controller = new AnimationController({
      accelerationDuration: 50,
    });
    controller.startSpin();
    await new Promise((r) => setTimeout(r, 80));
    expect(controller.getPhase()).toBe('spinning');
  });

  it('provides default config values', () => {
    const controller = new AnimationController();
    const config = controller.getConfig();
    expect(config.spinSpeed).toBe(0.5);
    expect(config.easing).toBe('ease-in-out');
    expect(config.accelerationDuration).toBe(300);
    expect(config.decelerationDuration).toBe(500);
    expect(config.stopDelays).toEqual([0, 200, 400]);
  });

  it('merges custom config with defaults', () => {
    const controller = new AnimationController({ spinSpeed: 1.0 });
    const config = controller.getConfig();
    expect(config.spinSpeed).toBe(1.0);
    expect(config.easing).toBe('ease-in-out');
  });

  it('calls onSpinComplete when all reels stop', async () => {
    const callback = vi.fn();
    const controller = new AnimationController(
      { stopDelays: [0, 0, 0], decelerationDuration: 10 },
      3
    );
    controller.onSpinComplete(callback);
    controller.startSpin();

    await controller.stopReel(0, 0);
    await controller.stopReel(1, 0);
    await controller.stopReel(2, 0);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(controller.getPhase()).toBe('idle');
  });

  it('does not call onSpinComplete until all reels stop', async () => {
    const callback = vi.fn();
    const controller = new AnimationController(
      { stopDelays: [0, 0, 0], decelerationDuration: 10 },
      3
    );
    controller.onSpinComplete(callback);
    controller.startSpin();

    await controller.stopReel(0, 0);
    await controller.stopReel(1, 0);

    expect(callback).not.toHaveBeenCalled();
  });

  it('removes callback with offSpinComplete', async () => {
    const callback = vi.fn();
    const controller = new AnimationController(
      { stopDelays: [0, 0, 0], decelerationDuration: 10 },
      3
    );
    controller.onSpinComplete(callback);
    controller.offSpinComplete(callback);
    controller.startSpin();

    await controller.stopReel(0, 0);
    await controller.stopReel(1, 0);
    await controller.stopReel(2, 0);

    expect(callback).not.toHaveBeenCalled();
  });
});
