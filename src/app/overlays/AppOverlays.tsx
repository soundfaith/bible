import { useRef, useState } from "react";
import { ModalLayer, type Modal } from "@/components/ModalLayer";
import { SearchModal, type SearchResult } from "@/features/search";
import { ChatWidget } from "@/features/chat";

type AppOverlaysProps = {
  modal: Modal | null;
  setModal: (modal: Modal | null) => void;
  onOpenVerse: (bookId: string, chapter: number, verse?: number) => void;
};

export function AppOverlays({ modal, setModal, onOpenVerse }: AppOverlaysProps) {
  const [searchInteracted, setSearchInteracted] = useState(false);
  const searchSheetStartY = useRef<number | null>(null);
  return (
    <>
      {(modal?.type === "chapter" || modal?.type === "bookmark") && (
        <ModalLayer modal={modal} close={() => setModal(null)} />
      )}
      {modal?.type === "search" && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <section
            className={searchInteracted ? "modal search-modal-shell search-modal-engaged" : "modal search-modal-shell"}
            role="dialog"
            aria-modal="true"
            onTouchStart={(event) => {
              if (window.innerWidth <= 760) {
                searchSheetStartY.current = event.touches[0].clientY;
              }
            }}
            onTouchMove={(event) => {
              if (
                window.innerWidth <= 760 &&
                searchSheetStartY.current !== null
              ) {
                const delta =
                  event.touches[0].clientY - searchSheetStartY.current;
                if (delta > 90) setModal(null);
              }
            }}
            onTouchEnd={() => {
              searchSheetStartY.current = null;
            }}
          >
            <SearchModal
              onInteraction={() => setSearchInteracted(true)}
              close={() => setModal(null)}
              onChoose={(result: SearchResult) => {
                modal.onChoose(result);
                setModal(null);
              }}
            />
          </section>
        </div>
      )}
      <ChatWidget onOpenVerse={onOpenVerse} />
    </>
  );
}
