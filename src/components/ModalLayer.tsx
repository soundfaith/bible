import { X } from "lucide-react";
import { useRef } from "react";
import { ChapterPicker, type ReadingPosition } from "../pages/ChapterPage";
import type { SearchResult } from "./SearchModal";

export type Modal = { type: "chapter"; current: ReadingPosition; onChoose: (position: ReadingPosition) => void } | { type: "search"; onChoose: (result: SearchResult) => void };

export function ModalLayer({ modal, close }: { modal: Extract<Modal, { type: "chapter" }>; close: () => void }) {
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="modal confirmation modal-wide" role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onTouchStart={(event) => { if (window.innerWidth <= 760) touchStartY.current = event.touches[0].clientY; }}
      onTouchMove={(event) => { if (window.innerWidth <= 760 && touchStartY.current !== null) touchCurrentY.current = event.touches[0].clientY; }}
      onTouchEnd={() => { if (window.innerWidth <= 760 && touchStartY.current !== null && touchCurrentY.current !== null) {
        const delta = touchCurrentY.current - touchStartY.current;
        if (delta > 90) close();
      }
      touchStartY.current = null;
      touchCurrentY.current = null; }}>
      <button className="modal-close" onClick={close} aria-label="Close dialog"><X size={18} /></button>
      <ChapterPicker current={modal.current} onChoose={(position) => { modal.onChoose(position); close(); }} />
    </section>
  </div>;
}