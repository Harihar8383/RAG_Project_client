// Renders model output as safe React elements. It supports paragraphs, bullet lists and **bold** text.
// No HTML is ever injected, so the text of a document cannot add markup to the page.

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export default function FormattedText({ text }) {
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

  return (
    <div className="space-y-2">
      {blocks.map((block) =>
        block.type === "list" ? (
          <ul key={block.key} className="list-disc pl-5 space-y-1">
            {block.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        ) : (
          <p key={block.key}>{renderInline(block.text)}</p>
        )
      )}
    </div>
  );
}
