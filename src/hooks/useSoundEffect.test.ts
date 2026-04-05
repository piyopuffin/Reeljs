import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EventEmitter } from '../infrastructure/event-emitter';
import { useSoundEffect } from './useSoundEffect';

describe('useSoundEffect', () => {
  it('returns initial muted and volume state', () => {
    const { result } = renderHook(() => useSoundEffect({ spinStart: '/spin.mp3' }));
    expect(result.current.isMuted).toBe(false);
    expect(result.current.volume).toBe(1);
  });

  it('toggleMute toggles muted state', () => {
    const { result } = renderHook(() => useSoundEffect({ spinStart: '/spin.mp3' }));
    act(() => {
      result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(true);
    act(() => {
      result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(false);
  });

  it('setVolume clamps between 0 and 1', () => {
    const { result } = renderHook(() => useSoundEffect({ spinStart: '/spin.mp3' }));
    act(() => {
      result.current.setVolume(0.5);
    });
    expect(result.current.volume).toBe(0.5);
    act(() => {
      result.current.setVolume(2);
    });
    expect(result.current.volume).toBe(1);
    act(() => {
      result.current.setVolume(-1);
    });
    expect(result.current.volume).toBe(0);
  });

  it('exposes soundMap', () => {
    const map = { spinStart: '/spin.mp3', win: '/win.mp3' };
    const { result } = renderHook(() => useSoundEffect(map));
    expect(result.current.soundMap).toBe(map);
  });
});
