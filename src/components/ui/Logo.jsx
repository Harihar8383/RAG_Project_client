// The Verix mark. Three linked nodes stand for documents that feed one answer.
export default function Logo({ size = 30, showText = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="drop-shadow-[0_0_10px_rgba(91,124,250,0.6)]"
      >
        <defs>
          <linearGradient id="verix-g" x1="2" y1="2" x2="30" y2="30">
            <stop stopColor="#7c9cff" />
            <stop offset="0.55" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="url(#verix-g)" opacity="0.18" stroke="url(#verix-g)" strokeWidth="1.5" />
        <path d="M9 10l7 12 7-12" stroke="url(#verix-g)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="10" r="2.2" fill="#7c9cff" />
        <circle cx="23" cy="10" r="2.2" fill="#22d3ee" />
        <circle cx="16" cy="22" r="2.2" fill="#a78bfa" />
      </svg>
      {showText && <span className="text-gradient text-2xl font-extrabold tracking-tight">Verix</span>}
    </span>
  );
}
