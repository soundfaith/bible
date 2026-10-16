import { useEffect } from "react";

const REVEAL_SELECTOR = [
  ".landing-hero-copy > *",
  ".landing-section-heading",
  ".landing-routine > .eyebrow",
  ".landing-card",
  ".landing-ask-card",
  ".landing-share",
  ".project-card",
  ".journey-library-item",
  ".journey-story",
  ".mass-reading-card",
  ".bookmark-item",
].join(",");

const STAGGER_MS = 70;
const MAX_STAGGER = 6;

/** Fades elements in as they scroll into view. State lives in a data attribute so React re-renders never wipe it. */
export function useScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        visible.forEach((entry, index) => {
          const el = entry.target as HTMLElement;
          el.style.setProperty("--reveal-delay", `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms`);
          el.dataset.reveal = "shown";
          observer.unobserve(el);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -4% 0px" },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset.reveal === "shown") return;
        el.dataset.reveal = "pending";
        observer.observe(el);
      });
    };

    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; scan(); });
    };
    scan();
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);
}
