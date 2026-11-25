export function BibleMark({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <circle className="bible-mark-bg" cx="24" cy="24" r="24" />
    <path className="bible-mark-flame" d="M24 5.5c-3.6 3.2-4.1 5.9 0 8.7 4.1-2.8 3.6-5.5 0-8.7Z" />
    <path className="bible-mark-page" d="M8 17.5c5.8-1.6 11.4-.8 16 2.8v17c-4.5-3.2-9.9-4.1-16-2.8v-17Z" />
    <path className="bible-mark-page" d="M40 17.5c-5.8-1.6-11.4-.8-16 2.8v17c4.5-3.2 9.9-4.1 16-2.8v-17Z" />
    <path className="bible-mark-lines" d="M12 23c3.1-.5 6.2.1 8.5 1.5M12 27.5c3.1-.4 6.2.2 8.5 1.6m15.5-6.1c-3.1-.5-6.2.1-8.5 1.5m8.5 3c-3.1-.4-6.2.2-8.5 1.6" />
    <path className="bible-mark-spine" d="M24 20.3v17" />
  </svg>;
}
