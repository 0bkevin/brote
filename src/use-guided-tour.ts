import { useEffect, useRef, useState } from 'react';
import { driver, type Driver } from 'driver.js';
import { useI18n } from './i18n';
import type { Page } from './components/MobileNav';
import type { Mode } from './types';
import { tourCopy } from './tour-copy';
import 'driver.js/dist/driver.css';
import './tour.css';

const key = 'brote-guided-tour-v1';
const stops: { page: Page; mode: Mode; target: string }[] = [
  { page: 'home', mode: 'practice', target: '[data-brote-tour="circle"]' },
  { page: 'wallets', mode: 'practice', target: '[data-brote-tour="wallet"]' },
  { page: 'learn', mode: 'practice', target: '[data-brote-tour="games"]' },
  { page: 'activity', mode: 'practice', target: '[data-brote-tour="activity"]' },
  { page: 'home', mode: 'crypto', target: '[data-brote-tour="solana"]' },
  { page: 'settings', mode: 'practice', target: '[data-brote-tour="preferences"]' },
];

export function useGuidedTour(options: {
  page: Page; mode: Mode; isGuardian: boolean; busy: boolean;
  navigate: (page: Page, mode: Mode) => void; onError: (message: string) => void;
}) {
  const { language } = useI18n();
  const copy = tourCopy[language];
  const latest = useRef(options);
  latest.current = options;
  const active = useRef<Driver | null>(null);
  const closeActive = useRef<(() => void) | null>(null);
  const [offered, setOffered] = useState(() => {
    try { return !localStorage.getItem(key); } catch { return true; }
  });
  const [running, setRunning] = useState(false);
  const [request, setRequest] = useState(0);
  const snapshot = useRef<{ page: Page; mode: Mode; scroll: number; focus: HTMLElement | null } | null>(null);
  const record = (status: string) => {
    setOffered(false);
    try { localStorage.setItem(key, status); } catch { /* This session still remembers the choice. */ }
  };
  const start = () => {
    if (active.current || running || latest.current.busy) return;
    snapshot.current = { page: latest.current.page, mode: latest.current.mode, scroll: window.scrollY, focus: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    record('started');
    setRunning(true);
    setRequest(value => value + 1);
  };

  useEffect(() => {
    if (!request) return;
    let disposed = false, finished = false, transitioning = true, restoreFrame = 0;
    let lastMove = -Infinity;
    const original = snapshot.current!;
    const root = document.getElementById('root');
    const previousInert = root?.inert ?? false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (root) root.inert = previousInert;
      active.current = null;
      closeActive.current = null;
      if (disposed) return;
      setRunning(false);
      latest.current.navigate(original.page, original.mode);
      restoreFrame = requestAnimationFrame(() => {
        window.scrollTo({ top: original.scroll, behavior: 'instant' });
        const fallback = Array.from(document.querySelectorAll<HTMLElement>('[data-tour-replay], .mobile-menu-trigger')).find(node => node.getClientRects().length > 0);
        (original.focus?.isConnected ? original.focus : fallback)?.focus({ preventScroll: true });
      });
    };
    const exit = (completed = false) => {
      try { localStorage.setItem(key, completed ? 'completed' : 'skipped'); } catch { /* Optional preference. */ }
      tour.destroy();
      finish();
    };
    const move = (index: number) => {
      if (finished || transitioning || performance.now() - lastMove < 240 || index < 0 || index >= stops.length) return;
      lastMove = performance.now();
      transitioning = true;
      const stop = stops[index];
      latest.current.navigate(stop.page, stop.mode);
      tour.moveTo(index);
    };
    const tour = driver({
      animate: !reducedMotion, duration: 180, smoothScroll: !reducedMotion,
      overlayColor: '#22264a', overlayOpacity: .24, stagePadding: 5, stageRadius: 12,
      popoverClass: 'brote-tour', popoverOffset: 12, showProgress: true,
      progressText: '{{current}} / {{total}}', nextBtnText: copy.next, prevBtnText: copy.back,
      doneBtnText: copy.done, closeBtnLabel: copy.skip, allowClose: true,
      overlayClickBehavior: 'none', disableActiveInteraction: true,
      waitForElement: 2000, allowKeyboardControl: true,
      steps: stops.map((stop, index) => {
        const words = copy.steps[index];
        const offset = !latest.current.isGuardian && words.length === 4 ? 2 : 0;
        return { element: stop.target, popover: { title: words[offset], description: words[offset + 1], side: 'bottom' as const, align: 'start' as const } };
      }),
      onNextClick: (_, __, { index }) => move((index ?? 0) + 1),
      onPrevClick: (_, __, { index }) => move((index ?? 0) - 1),
      onDoneClick: () => exit(true), onCloseClick: () => exit(),
      onDestroyStarted: () => exit(), onDestroyed: finish,
      onHighlighted: () => { transitioning = false; },
      onPopoverRender: popover => {
        popover.wrapper.setAttribute('role', 'dialog');
        popover.wrapper.setAttribute('aria-modal', 'true');
        popover.wrapper.setAttribute('aria-label', popover.title.textContent ?? 'Brote');
        popover.wrapper.prepend(popover.progress);
        popover.closeButton.textContent = copy.skip;
        popover.footer.prepend(popover.closeButton);
        popover.footerButtons.classList.add('brote-tour-navigation');
        popover.nextButton.focus({ preventScroll: true });
      },
    });
    active.current = tour;
    closeActive.current = () => exit();
    if (root) root.inert = true;
    latest.current.navigate(stops[0].page, stops[0].mode);
    try { tour.drive(); } catch { tour.destroy(); finish(); latest.current.onError(copy.error); }
    return () => {
      disposed = true;
      cancelAnimationFrame(restoreFrame);
      tour.destroy();
      finish();
    };
    // A tour is created only by an explicit start request, never by a re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  useEffect(() => { closeActive.current?.(); }, [language]);
  return { copy, offered, running, start, skip: () => record('skipped') };
}
