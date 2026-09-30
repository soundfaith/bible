import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { ChapterPicker, type ReadingPosition } from "../pages/ChapterPage";
import { DEFAULT_BOOKMARK_CATEGORY } from "../lib/bookmarks";
import type { SearchResult } from "./SearchModal";

export type Modal = { type: "chapter"; current: ReadingPosition; onChoose: (position: ReadingPosition) => void } | { type: "bookmark"; categories: string[]; onSave: (category: string) => void; onAddCategory: (category: string) => void } | { type: "search"; onChoose: (result: SearchResult) => void };

export function ModalLayer({ modal, close }: { modal: Extract<Modal, { type: "chapter" | "bookmark" }>; close: () => void }) {
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  if (modal.type === "bookmark") return <BookmarkCategoryPicker modal={modal} close={close} />;

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

function BookmarkCategoryPicker({ modal, close }: { modal: Extract<Modal, { type: "bookmark" }>; close: () => void }) {
  const initialCategories = modal.categories.length ? modal.categories : [DEFAULT_BOOKMARK_CATEGORY];
  const [category, setCategory] = useState(initialCategories[0]);
  const [availableCategories, setAvailableCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const addCategory = () => {
    const value = newCategory.trim();
    if (!value) return;
    const existing = availableCategories.find((item) => item.toLowerCase() === value.toLowerCase());
    const selected = existing || value;
    if (!existing) setAvailableCategories((current) => [...current, selected]);
    modal.onAddCategory(selected);
    setCategory(selected);
    setNewCategory("");
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="modal confirmation bookmark-category-modal" role="dialog" aria-modal="true" aria-labelledby="bookmark-category-title">
      <button className="modal-close" onClick={close} aria-label="Close dialog"><X size={18} /></button>
      <p className="eyebrow">Save passage</p><h2 id="bookmark-category-title">Choose a <em>category.</em></h2>
      <div className="bookmark-category-options">{availableCategories.map((item) => <button key={item} className={item === category ? "picker-pill active" : "picker-pill"} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="bookmark-category-add"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addCategory(); }} placeholder="New category" aria-label="New category" /><button className="icon-button" onClick={addCategory} aria-label="Add category"><Plus size={16} /></button></div>
      <button className="button button-coral" onClick={() => { modal.onSave(category); close(); }}>Save bookmark</button>
    </section>
  </div>;
}
