// Renders model output as safe React elements. It supports paragraphs, bullet lists, **bold** text and
// source markers such as [S1], which show as small badges. No HTML is ever injected, so the text of a
// document cannot add markup to the page.

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|\[S\d+\])/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (/^\[S\d+\]$/.test(part)) {
      return (
        <span
          key={i}
          title={`Source ${part.slice(1, -1)}`}
          className="mx-0.5 inline-flex -translate-y-px items-center rounded-md bg-brand-500/20 px-1.5 text-[10px] font-semibold leading-4 text-brand-400 ring-1 ring-brand-500/30"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

export default function FormattedText({ text, streaming = false }) {
  const lines = String(text ?? "").split("\n");
  const blocks = [];
  let list = null;

  lines.forEach((line, index) => {
    const bullet = /^\s*[*-]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ type: "list", items: list, key: index });
      }
      list.push(bullet[1]);
      return;
    }
    list = null;
    if (line.trim()) blocks.push({ type: "p", text: line, key: index });
  });

  const lastIndex = blocks.length - 1;

  return (
    <div className="space-y-2.5 leading-relaxed">
      {blocks.map((block, b) => {
        const caret = streaming && b === lastIndex ? "caret" : "";
        return block.type === "list" ? (
          <ul key={block.key} className="list-disc space-y-1 pl-5 marker:text-brand-400">
            {block.items.map((item, i) => (
              <li key={i} className={i === block.items.length - 1 ? caret : ""}>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={block.key} className={caret}>
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
