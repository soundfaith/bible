import { Moon, Sun } from "lucide-react";

export function Brand() {
  return (
    <a className="wordmark" href="#/" aria-label="Soundfaith Bible home">
      <span className="wordmark-mark">sf</span>
      <span>soundfaith bible</span>
    </a>
  );
}
export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
}) {
  return (
    <button
      className="icon-button theme-toggle"
      onClick={onToggle}
      aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
      title={`Use ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
