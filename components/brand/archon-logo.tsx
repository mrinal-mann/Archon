import type { CSSProperties } from "react"

/**
 * Archon brand mark — a triangular monogram with an arch cutout.
 * The triangle fills with `currentColor`, so set the color via a `text-*`
 * utility on the element (or a parent) / inline `color` for the landing page.
 */
export function ArchonLogo({
  size = 24,
  className,
  style,
}: {
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <mask id="archon-arch-cutout">
          <rect width="512" height="512" fill="white" />
          <path
            d="M216 360 L216 245 A40 40 0 0 1 296 245 L296 360 Z"
            fill="black"
          />
        </mask>
      </defs>
      <path
        d="M256 70 L90 360 L422 360 Z"
        fill="currentColor"
        mask="url(#archon-arch-cutout)"
      />
    </svg>
  )
}
