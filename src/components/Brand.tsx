import { BibleMark } from "./BibleMark";

export function Brand() {
  return (
    <a className="wordmark" href="#/" aria-label="Soundfaith Bible home">
      <span className="wordmark-mark"><BibleMark /></span>
      <span>soundfaith bible</span>
    </a>
  );
}
export function ThemeToggle({
  theme,
  onChange,
}: {
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
}) {
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {(["light", "dark"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={theme === option}
          onClick={() => onChange(option)}
        >
          {option === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}
