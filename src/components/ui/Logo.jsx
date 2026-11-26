// The Second Brain mark: two brain halves joined by a stem, drawn in the accent colour.
export default function Logo({ size = 30, showText = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="fill-accent inline-flex items-center justify-center rounded-[30%]" style={{ width: size, height: size }}>
        <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 7v18M16 10c-2.5-1.5-6-.5-6 2.2 0 1.5.8 2.5 1.5 3-1.6.6-2.6 2-2.6 3.6 0 2.2 2.2 3.8 4.8 3.2M16 10c2.5-1.5 6-.5 6 2.2 0 1.5-.8 2.5-1.5 3 1.6.6 2.6 2 2.6 3.6 0 2.2-2.2 3.8-4.8 3.2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showText && <span className="text-xl font-bold tracking-tight text-white">Second Brain</span>}
    </span>
  );
}
