import { useEffect } from "react";

// Scrolling down hides the mobile header; scrolling up or returning to the top shows it.
export function useHeaderAutoHide() {
  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      if (Math.abs(delta) < 6 && y > 8) return;
      lastY = y;
      const menuOpen = document.querySelector(".main-nav.nav-open") !== null;
      root.classList.toggle("home-header-hidden", y > 8 && delta > 0 && !menuOpen);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.classList.remove("home-header-hidden");
    };
  }, []);
}
