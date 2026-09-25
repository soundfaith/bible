const BOOKMARKS_KEY = "bible-bookmarks";

export type Bookmark = { bookId: string; chapter: number; createdAt: number };

export function getBookmarks(): Bookmark[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(BOOKMARKS_KEY) || "[]") as Bookmark[];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]) {
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}
