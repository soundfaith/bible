import { ArrowRight, Bookmark, Trash2 } from "lucide-react";
import { getBook } from "../lib/bible";
import type { Bookmark as BookmarkRecord } from "../lib/bookmarks";

export function BookmarksPage({ bookmarks, onOpen, onRemove }: { bookmarks: BookmarkRecord[]; onOpen: (bookmark: BookmarkRecord) => void; onRemove: (bookmark: BookmarkRecord) => void }) {
  return <main className="bookmarks-page section-wrap">
    <header className="bookmarks-heading">
      <div><p className="eyebrow"><span className="eyebrow-dot" /> Your library</p><h1>Saved <em>passages.</em></h1><p className="page-intro">Keep the chapters you want to return to close at hand.</p></div>
      <Bookmark size={22} />
    </header>
    {bookmarks.length === 0 ? <div className="bookmarks-empty"><Bookmark size={20} /><h2>Nothing saved yet.</h2><p>Use the bookmark button while reading a chapter to keep it here.</p></div> : <div className="bookmark-list">{bookmarks.map((bookmark) => { const book = getBook(bookmark.bookId); return <article className="bookmark-item" key={`${bookmark.bookId}-${bookmark.chapter}`}><div><span className="bookmark-label">{book.abbreviation}</span><h2>{book.name} {bookmark.chapter}</h2><p>Chapter saved for your next return.</p></div><div className="bookmark-actions"><button className="icon-button" onClick={() => onRemove(bookmark)} aria-label={`Remove ${book.name} chapter ${bookmark.chapter}`}><Trash2 size={16} /></button><button className="button button-outline" onClick={() => onOpen(bookmark)}>Open <ArrowRight size={14} /></button></div></article>; })}</div>}
  </main>;
}
