const BOOKMARKS_KEY = "bible-bookmarks";
const CATEGORIES_KEY = "bible-bookmark-categories";
export const DEFAULT_BOOKMARK_CATEGORY = "Read later";

export type Bookmark = { bookId: string; chapter: number; createdAt: number; category?: string; verseStart?: number; verseEnd?: number };

export function isVerseBookmark(bookmark: Bookmark): boolean {
  return Number.isSafeInteger(bookmark.verseStart) && (bookmark.verseStart ?? 0) > 0;
}

export function getBookmarkCategories(): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CATEGORIES_KEY) || "[]") as unknown;
    return Array.isArray(saved) ? [...new Set(saved.filter((item): item is string => typeof item === "string" && Boolean(item.trim())))] : [DEFAULT_BOOKMARK_CATEGORY];
  } catch { return [DEFAULT_BOOKMARK_CATEGORY]; }
}

export function saveBookmarkCategories(categories: string[]) {
  window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify([...new Set(categories)]));
}

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
