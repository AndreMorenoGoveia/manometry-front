import { useEffect } from "react";

type LenisLike = {
  raf: (time: number) => void;
  destroy: () => void;
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number }) => void;
};

let instance: LenisLike | null = null;

/** Scroll to an element by id, through Lenis when it is running. */
export function scrollToId(id: string, offset = -80): void {
  const element = document.getElementById(id);
  if (!element) return;
  if (instance) {
    instance.scrollTo(element, { offset });
    return;
  }
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Lenis smooth scrolling, loaded lazily so the first paint never waits on it.
 *
 * While Lenis is running it drives `window.scrollTo` itself, so the CSS
 * `scroll-behavior: smooth` (which is the fallback for when Lenis is absent)
 * is switched off for the duration — the two animating the same scroll position
 * fight and produce a stutter.
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || typeof requestAnimationFrame === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let cancelled = false;
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href^='#']");
      const href = anchor?.getAttribute("href");
      if (!href || href.length < 2) return;
      const id = href.slice(1);
      if (!document.getElementById(id)) return;
      event.preventDefault();
      scrollToId(id);
      history.replaceState(null, "", href);
    };

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      instance = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 }) as LenisLike;
      root.style.scrollBehavior = "auto";
      const loop = (time: number) => {
        instance?.raf(time);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    });

    document.addEventListener("click", onAnchorClick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onAnchorClick);
      instance?.destroy();
      instance = null;
      root.style.scrollBehavior = previousBehavior;
    };
  }, [enabled]);
}
