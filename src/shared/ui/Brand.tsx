export function Brand() {
  return (
    <a className="wordmark" href="#/" aria-label="SoundFaith home">
      <span className="wordmark-mark"><img src="/favicon.svg" alt="" /></span>
      <span>SoundFaith</span>
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
