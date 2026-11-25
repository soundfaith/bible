import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { Modal } from "@/components/ModalLayer";
import type { ReadingPosition, SelectedVerseRange } from "@/features/bible";
import { getBookmarkCategories, getBookmarks, isVerseBookmark, saveBookmarkCategories, saveBookmarks, type Bookmark } from "@/features/bookmarks";
import type { Route } from "../routing";

type AppBookmarksOptions = {
  route: Route;
  readingPosition: ReadingPosition;
  setModal: Dispatch<SetStateAction<Modal | null>>;
};

export function useAppBookmarks({ route, readingPosition, setModal }: AppBookmarksOptions) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getBookmarks);
  const [bookmarkCategories, setBookmarkCategories] = useState<string[]>(getBookmarkCategories);
  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);
  const isChapterBookmarked =
    route === "read" &&
    bookmarks.some(
      (bookmark) =>
        bookmark.bookId === readingPosition.bookId &&
        bookmark.chapter === readingPosition.chapter &&
        !isVerseBookmark(bookmark),
    );
  const isBookmarked = route === "read" && bookmarks.some(
    (bookmark) => bookmark.bookId === readingPosition.bookId && bookmark.chapter === readingPosition.chapter,
  );
  const toggleBookmark = (verseRange?: SelectedVerseRange) => {
    if (!verseRange && isChapterBookmarked) {
      setBookmarks((current) => current.filter((bookmark) => bookmark.bookId !== readingPosition.bookId || bookmark.chapter !== readingPosition.chapter || isVerseBookmark(bookmark)));
      return;
    }
    setModal({ type: "bookmark", categories: bookmarkCategories, onSave: (category) => {
      setBookmarkCategories((current) => {
        if (current.some((item) => item.toLowerCase() === category.toLowerCase())) return current;
        const next = [...current, category];
        saveBookmarkCategories(next);
        return next;
      });
      setBookmarks((current) => {
        const bookmark: Bookmark = { ...readingPosition, createdAt: Date.now(), category };
        if (verseRange) Object.assign(bookmark, verseRange);
        return [bookmark, ...current];
      });
    }, onAddCategory: (category) => {
      setBookmarkCategories((current) => {
        const next = current.some((item) => item.toLowerCase() === category.toLowerCase()) ? current : [...current, category];
        saveBookmarkCategories(next);
        return next;
      });
    } });
  };
  const removeBookmark = (bookmark: Bookmark) =>
    setBookmarks((current) =>
      current.filter(
        (item) =>
          item.bookId !== bookmark.bookId || item.chapter !== bookmark.chapter ||
          item.verseStart !== bookmark.verseStart || item.verseEnd !== bookmark.verseEnd,
      ),
    );
  const removeBookmarkCategory = (category: string) => {
    const next = bookmarkCategories.filter((item) => item !== category);
    setBookmarkCategories(next);
    saveBookmarkCategories(next);
  };
  return { bookmarks, bookmarkCategories, isChapterBookmarked, isBookmarked, toggleBookmark, removeBookmark, removeBookmarkCategory };
}
