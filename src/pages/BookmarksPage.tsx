import { ArrowUpRight, Bookmark, BookOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { getBook, getChapter } from "../lib/bible";
import { isVerseBookmark, type Bookmark as BookmarkRecord } from "../lib/bookmarks";

export function BookmarksPage({ bookmarks, categories, onOpen, onRemove, onRemoveCategory }: { bookmarks: BookmarkRecord[]; categories: string[]; onOpen: (bookmark: BookmarkRecord) => void; onRemove: (bookmark: BookmarkRecord) => void; onRemoveCategory: (category: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const visibleBookmarks = activeCategory === "All" ? bookmarks : bookmarks.filter((bookmark) => (bookmark.category || "Read later") === activeCategory);
  return <main className="bookmarks-page section-wrap">
    <header className="bookmarks-heading">
      <div><p className="eyebrow"><span className="eyebrow-dot" /> Your library</p><h1>Saved <em>passages.</em></h1><p className="page-intro">Keep the chapters you want to return to close at hand.</p></div>
      <Bookmark size={22} />
    </header>
    <>
      <div className="bookmark-category-tabs" role="tablist" aria-label="Bookmark categories">
        {["All", ...categories].map((category) => <button key={category} className={activeCategory === category ? "active" : ""} role="tab" aria-selected={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}
      </div>
      {visibleBookmarks.length ? <div className="bookmark-list">{visibleBookmarks.map((bookmark) => {
        const book = getBook(bookmark.bookId);
        const chapterVerses = getChapter(bookmark.bookId, bookmark.chapter);
        const verseBookmark = isVerseBookmark(bookmark);
        const previewVerses = verseBookmark ? chapterVerses.filter((verse) => verse.verse >= bookmark.verseStart! && verse.verse <= (bookmark.verseEnd ?? bookmark.verseStart!)) : chapterVerses.slice(0, 1);
        const preview = previewVerses.map((verse) => verseBookmark ? `${verse.verse}. ${verse.text}` : verse.text).join(" ");
        const passage = !verseBookmark ? "" : ` · ${bookmark.verseStart}${bookmark.verseEnd && bookmark.verseEnd !== bookmark.verseStart ? `–${bookmark.verseEnd}` : ""}`;
        const open = () => onOpen(bookmark);
        return <article className="bookmark-item" key={`${bookmark.bookId}-${bookmark.chapter}-${bookmark.verseStart ?? "chapter"}-${bookmark.verseEnd ?? ""}`} tabIndex={0} aria-label={`Open ${book.name} chapter ${bookmark.chapter}${passage}`} onClick={open} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); open(); } }}>
          <span className="bookmark-card-icon"><Bookmark size={16} /></span>
          <div className="bookmark-copy"><span className="bookmark-label">{book.abbreviation}{passage} · {bookmark.category || "Read later"}</span><h2>{book.name} {bookmark.chapter}</h2><p>{preview}</p></div>
          <div className="bookmark-actions"><button className="icon-button" onClick={(event) => { event.stopPropagation(); onRemove(bookmark); }} aria-label={`Remove ${book.name} chapter ${bookmark.chapter}${passage}`}><Trash2 size={15} /></button><button className="icon-button" onClick={(event) => { event.stopPropagation(); open(); }} aria-label={`Open ${book.name} chapter ${bookmark.chapter}${passage}`}><BookOpen size={16} /><ArrowUpRight size={10} className="bookmark-open-mark" /></button></div>
        </article>;
      })}</div> : <div className="bookmarks-empty"><Bookmark size={20} /><h2>{bookmarks.length === 0 ? "Nothing saved yet." : "No passages in this category."}</h2><p>{bookmarks.length === 0 ? "Use the bookmark button while reading a chapter to keep it here." : "Save a chapter here from the Bible reader."}</p>{activeCategory !== "All" && <button className="button button-outline bookmark-category-remove" onClick={() => { onRemoveCategory(activeCategory); setActiveCategory("All"); }}><Trash2 size={14} /> Remove category</button>}</div>}
    </>
  </main>;
}
