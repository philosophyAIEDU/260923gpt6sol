import { Canvas } from '@react-three/fiber';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SceneReadySignal } from './components/scene/SceneReadySignal';
import { SolarScene } from './components/scene/SolarScene';
import { Header } from './components/ui/Header';
import { GuidedTour } from './components/ui/GuidedTour';
import { InfoPanel } from './components/ui/InfoPanel';
import { InteractionHint } from './components/ui/InteractionHint';
import { Loader } from './components/ui/Loader';
import { PlanetNav } from './components/ui/PlanetNav';
import { PhotoGallery } from './components/ui/PhotoGallery';
import { QuizModal } from './components/ui/QuizModal';
import { TimeControl } from './components/ui/TimeControl';
import { Toast } from './components/ui/Toast';
import { TopControls } from './components/ui/TopControls';
import { useAmbientSound } from './hooks/useAmbientSound';
import { useHoverCursor } from './hooks/useHoverCursor';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTexturePreload } from './hooks/useTexturePreload';
import { useAppStore } from './store/useAppStore';
import { colors } from './styles/tokens';
import { QUALITY_PROFILES } from './utils/quality';

export default function App(): JSX.Element {
  const [tourOpen, setTourOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  useTexturePreload();
  useKeyboardShortcuts();
  useHoverCursor();
  const soundOn = useAppStore((s) => s.soundOn);
  useAmbientSound(soundOn);

  const texturesReady = useAppStore((s) => s.loading.texturesReady);
  const sceneReady = useAppStore((s) => s.loading.sceneReady);
  const quality = useAppStore((s) => s.quality);
  const quizOpen = useAppStore((s) => s.quiz.open);
  const closeQuiz = useAppStore((s) => s.closeQuiz);
  const openQuiz = useAppStore((s) => s.openQuiz);
  const profile = QUALITY_PROFILES[quality];

  useEffect(() => {
    if (!tourOpen && !galleryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setTourOpen(false); setGalleryOpen(false); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tourOpen, galleryOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative h-full w-full overflow-hidden">
        {texturesReady && (
          <div className="absolute inset-0 isolate z-0" aria-label="3D 태양계 장면" role="img">
            <Canvas
              dpr={profile.dpr}
              gl={{
                antialias: true,
                alpha: false,
                stencil: false,
                powerPreference: 'high-performance',
                logarithmicDepthBuffer: true,
              }}
              camera={{ fov: 45, near: 0.0005, far: 60000, position: [60, 1300, 2600] }}
              onCreated={({ gl, scene }) => {
                gl.setClearColor(colors.space[900]);
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                scene.background = new THREE.Color(colors.space[900]);
              }}
            >
              <Suspense fallback={null}>
                <SolarScene />
                <SceneReadySignal />
              </Suspense>
            </Canvas>
          </div>
        )}

        {/* HUD — 레이아웃은 여백을 넉넉히, 요소는 화면 가장자리에 여유 있게 배치 */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-5 top-5 md:left-8 md:top-7">
            <Header />
          </div>
          <div className="absolute right-4 top-4 md:right-7 md:top-7">
            <TopControls
              onTour={() => { closeQuiz(); setGalleryOpen(false); setTourOpen((v) => !v); }}
              onGallery={() => { setTourOpen(false); setGalleryOpen((v) => !v); }}
              tourOpen={tourOpen}
              galleryOpen={galleryOpen}
            />
          </div>
          <AnimatePresence>
            {!quizOpen && !tourOpen && !galleryOpen && (
              <motion.div
                key="nav"
                className="absolute inset-x-3 bottom-[118px] md:inset-x-auto md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <PlanetNav />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-3 bottom-4 flex flex-col items-center gap-3 pb-safe md:bottom-7">
            <InteractionHint />
            <TimeControl />
          </div>
          <div className={quizOpen || tourOpen || galleryOpen ? 'max-md:hidden' : ''}>
            <InfoPanel />
          </div>
          {tourOpen && <GuidedTour onClose={() => setTourOpen(false)} onQuiz={() => { setTourOpen(false); openQuiz(); }} />}
          {galleryOpen && <PhotoGallery onClose={() => setGalleryOpen(false)} />}
          <QuizModal />
          <Toast />
        </div>

        <AnimatePresence>{!sceneReady && <Loader key="loader" />}</AnimatePresence>
      </main>
    </MotionConfig>
  );
}
