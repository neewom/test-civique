/**
 * Horizontal Futur Citoyen logo: the sprout symbol (small-size variant with
 * thicker strokes) and the name. "Futur" is deep green in light mode and
 * light green in dark mode; strokes follow the ink / light text colour.
 */
export function BrandLogo() {
  const stroke = 'stroke-[#2c2e2a] dark:stroke-[#f1eee4]'
  return (
    <span className="inline-flex items-center gap-[0.4em]">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="size-[1.25em] shrink-0"
      >
        <path d="M32 60 V30" className={stroke} strokeWidth="7" strokeLinecap="round" />
        <path
          d="M32 35 C 31 21, 20 13, 6 14 C 6 29, 18 37, 32 35 Z"
          className={`fill-[#8ed462] ${stroke}`}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M32 28 C 33 14, 44 6, 58 7 C 58 22, 46 30, 32 28 Z"
          className={`fill-[#f5e211] dark:fill-[#f2de2e] ${stroke}`}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Left-aligned so a wrapped name (enlarged text) stacks beside the symbol */}
      <span className="text-left">
        <span className="text-[#3a7a2c] dark:text-[#8ed462]">Futur</span>{' '}
        <span className="text-[#2c2e2a] dark:text-[#f1eee4]">Citoyen</span>
      </span>
    </span>
  )
}
