import { useState } from "react";
import { Palette } from "lucide-react";
import { THEMES, setTheme } from "./theme";

const NAMES = { teal: "Teal", sand: "Sand", mono: "Mono" };

/** Cycles through the themes: teal, sand, mono. */
export default function ThemeToggle({ className = "" }) {
  const [theme, setLocal] = useState(() => document.documentElement.dataset.theme || THEMES[0]);
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        setLocal(next);
      }}
      aria-label={`Theme: ${NAMES[theme] ?? theme}. Switch to ${NAMES[next]}`}
      title={`Switch to ${NAMES[next]} theme`}
      className={`btn-ghost flex h-9 w-9 items-center justify-center rounded-full text-gray-300 ${className}`}
    >
      <Palette size={16} />
    </button>
  );
}
