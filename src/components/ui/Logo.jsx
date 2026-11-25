// The Second Brain mark. An interconnected neural network representing an external memory and knowledge engine.
export default function Logo({ size = 30, showText = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="drop-shadow-[0_0_10px_rgba(124,156,255,0.6)]"
      >
        <defs>
          <linearGradient id="brain-g" x1="2" y1="2" x2="30" y2="30">
            <stop stopColor="#7c9cff" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="9"
          fill="url(#brain-g)"
          opacity="0.18"
          stroke="url(#brain-g)"
          strokeWidth="1.5"
        />
        {/* Brain neural circuits */}
        <path
          d="M16 8v16M16 11c-2.5-1.5-5.5-.5-5.5 2 0 1.5.8 2.5 1.5 3-1.5.5-2.5 2-2.5 3.5 0 2 2 3.5 4.5 3M16 11c2.5-1.5 5.5-.5 5.5 2 0 1.5-.8 2.5-1.5 3 1.5.5 2.5 2 2.5 3.5 0 2-2 3.5-4.5 3M12 16h4M16 16h4M13.5 19.5H16M16 19.5h2.5M14 12.5H16M16 12.5h2"
          stroke="url(#brain-g)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="8" r="1.5" fill="#7c9cff" />
        <circle cx="10.5" cy="13" r="1.5" fill="#7c9cff" />
        <circle cx="21.5" cy="13" r="1.5" fill="#22d3ee" />
        <circle cx="9.5" cy="19.5" r="1.5" fill="#a855f7" />
        <circle cx="22.5" cy="19.5" r="1.5" fill="#22d3ee" />
        <circle cx="16" cy="24" r="1.5" fill="#a855f7" />
      </svg>
      {showText && <span className="text-gradient text-2xl font-extrabold tracking-tight">Second Brain</span>}
    </span>
  );
}
