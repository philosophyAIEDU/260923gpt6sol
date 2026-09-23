import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const camUp = new THREE.Vector3();
import { getBodyRuntime } from '../../store/runtime';
import { useAppStore } from '../../store/useAppStore';
import type { CelestialBody } from '../../types';

interface BodyLabelProps {
  body: CelestialBody;
}

/**
 * 천체 이름표 (DOM 오버레이). 화면 크기가 일정해 실제 비율 모드에서도 천체를 찾고 클릭할 수 있습니다.
 * 위치는 매 프레임 runtime에서 읽어 그룹을 이동시키고, React 리렌더는 선택/호버가 바뀔 때만 일어납니다.
 */
export function BodyLabel({ body }: BodyLabelProps): JSX.Element {
  const group = useRef<THREE.Group>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const near = useRef(false);
  const selected = useAppStore((s) => s.selectedId === body.id);
  const hovered = useAppStore((s) => s.hoveredId === body.id);
  const showLabels = useAppStore((s) => s.showLabels);
  const select = useAppStore((s) => s.select);
  const hover = useAppStore((s) => s.hover);

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    const rt = getBodyRuntime(body.id);
    // 이름표를 천체의 "화면상 위쪽 가장자리"에 붙입니다 (카메라의 up 벡터 방향으로 반지름만큼).
    camUp.setFromMatrixColumn(camera.matrixWorld, 1);
    g.position.copy(rt.position).addScaledVector(camUp, rt.radius * 1.08);
    // 천체에 충분히 가까우면(화면에 크게 보이면) 이름표가 표면을 가리지 않도록 숨깁니다.
    const isNear = camera.position.distanceTo(rt.position) < rt.radius * 14;
    if (isNear !== near.current && fadeRef.current) {
      near.current = isNear;
      fadeRef.current.style.opacity = isNear ? '0' : '1';
      fadeRef.current.style.visibility = isNear ? 'hidden' : 'visible';
    }
    // 우선순위 -0.5: 카메라 리그(-1) 이후, drei <Html>의 화면 투영(0) 이전에 위치를 갱신해야
    // 카메라가 빠르게 움직여도 이름표가 한 프레임 늦게 따라오는 현상이 없습니다.
  }, -0.5);

  const isMoon = body.type === 'moon';
  const visible = showLabels || selected || hovered;

  return (
    <group ref={group}>
      <Html
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
        wrapperClass="body-label-wrapper"
      >
        <div ref={fadeRef} className="transition-opacity duration-300">
        <button
          type="button"
          aria-label={`${body.name} 선택`}
          onClick={() => select(body.id)}
          onPointerEnter={() => hover(body.id)}
          onPointerLeave={() => hover(null)}
          className={[
            'body-label group pointer-events-auto flex select-none items-center gap-1.5 whitespace-nowrap rounded-full',
            'font-display tracking-wide transition-all duration-220 ease-out-quint',
            isMoon ? 'text-[10px]' : 'text-[11px]',
            visible ? 'opacity-100' : 'pointer-events-none opacity-0',
            selected
              ? 'text-accent-cyan'
              : hovered
                ? 'text-ink-primary'
                : 'text-ink-secondary/80 hover:text-ink-primary',
          ].join(' ')}
          style={{ transform: 'translate(0, -0.95rem)' }}
        >
          <span
            aria-hidden
            className={[
              'h-1.5 w-1.5 rounded-full transition-all duration-220',
              selected ? 'scale-125 shadow-[0_0_10px_2px_rgba(77,216,255,0.8)]' : '',
            ].join(' ')}
            style={{ backgroundColor: selected ? '#4dd8ff' : body.color }}
          />
          <span className="drop-shadow-[0_1px_6px_rgba(5,5,16,0.9)]">{body.name}</span>
        </button>
        </div>
      </Html>
    </group>
  );
}
