export const LABELS = {
  strong: { text: "Strong match", className: "bg-emerald-400/10 text-emerald-300" },
  check: { text: "Check this", className: "bg-amber-400/10 text-amber-300" },
  none: { text: "No match found", className: "bg-rose-400/10 text-rose-300" },
};

/** The user's correction wins over the app's label. */
export const labelOf = (item) => item.override || item.label;

/** The topics the student still has to look at: everything that is not a strong match. */
export function revisionList(items) {
  return ["none", "check"]
    .flatMap((label) => {
      const topics = items.filter((i) => labelOf(i) === label);
      return topics.length ? [LABELS[label].text, ...topics.map((i) => `- ${i.topic}`), ""] : [];
    })
    .join("\n");
}
