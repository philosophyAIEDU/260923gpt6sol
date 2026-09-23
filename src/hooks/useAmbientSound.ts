import { useEffect, useRef } from 'react';

interface AmbientNodes {
  ctx: AudioContext;
  master: GainNode;
  stop: () => void;
}

/**
 * 우주 앰비언트 사운드 (외부 음원 없이 Web Audio로 합성).
 *  - 브라운 노이즈 → 저역 통과 필터(LFO로 천천히 열고 닫힘) : 우주선 내부 같은 웅웅거림
 *  - 살짝 어긋난 두 개의 저음 사인파 : 은은한 드론
 * 켜고 끌 때 1.2초 페이드로 툭 끊기지 않게 합니다.
 */
function createAmbient(): AmbientNodes | null {
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // 브라운 노이즈 버퍼 (적분된 백색 소음)
  const length = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.6;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(filter.frequency);
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.55;
  noise.connect(filter).connect(noiseGain).connect(master);

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.05;
  const oscA = ctx.createOscillator();
  oscA.frequency.value = 55;
  const oscB = ctx.createOscillator();
  oscB.frequency.value = 82.6;
  oscA.connect(droneGain);
  oscB.connect(droneGain);
  droneGain.connect(master);

  noise.start();
  lfo.start();
  oscA.start();
  oscB.start();

  return {
    ctx,
    master,
    stop: () => {
      noise.stop();
      lfo.stop();
      oscA.stop();
      oscB.stop();
      void ctx.close();
    },
  };
}

export function useAmbientSound(enabled: boolean): void {
  const nodes = useRef<AmbientNodes | null>(null);

  useEffect(() => {
    if (!enabled) {
      const n = nodes.current;
      if (n) {
        const now = n.ctx.currentTime;
        n.master.gain.cancelScheduledValues(now);
        n.master.gain.setTargetAtTime(0, now, 0.35);
      }
      return;
    }
    if (!nodes.current) nodes.current = createAmbient();
    const n = nodes.current;
    if (!n) return;
    void n.ctx.resume();
    const now = n.ctx.currentTime;
    n.master.gain.cancelScheduledValues(now);
    n.master.gain.setTargetAtTime(0.18, now, 0.4);
  }, [enabled]);

  useEffect(
    () => () => {
      nodes.current?.stop();
      nodes.current = null;
    },
    [],
  );
}
