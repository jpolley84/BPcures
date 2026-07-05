// TriangleVisual — the BP Triangle method-mark as a small reusable component.
//
// RECREATED 2026-07-03: the original (ported from braveworks-bp alongside
// WelcomePage.jsx) was lost in a working-tree revert; this is a faithful,
// prop-compatible rebuild from its call sites:
//   <TriangleVisual size={110} showLabels={false} emphasis={corner} />
//
// Props:
//   size       px width of the mark (height scales with it). Default 120.
//   showLabels render the Stress / Sugar / Sodium corner labels. Default true.
//   emphasis   'stress' | 'sugar' | 'sodium' — highlights that corner's dot in
//              clay and enlarges it slightly. Omit for a neutral mark.
//
// Layout matches the brand canon (see CheckoutPage's BpTriangle): Sodium at the
// top (the corner BP is measured at), Stress bottom-left, Sugar bottom-right.
// Pure SVG, no animation library, decorative by default (aria-hidden when no
// labels). ZERO em-dashes in any visible copy.

const CORNERS = {
  sodium: { x: 100, y: 28, labelX: 100, labelY: 16, anchor: 'middle', label: 'Sodium' },
  stress: { x: 36, y: 140, labelX: 24, labelY: 158, anchor: 'middle', label: 'Stress' },
  sugar: { x: 164, y: 140, labelX: 176, labelY: 158, anchor: 'middle', label: 'Sugar' },
};

export default function TriangleVisual({ size = 120, showLabels = true, emphasis }) {
  const height = Math.round(size * 0.87); // 174/200 aspect of the method-mark
  return (
    <svg
      viewBox="0 0 200 174"
      width={size}
      height={height}
      role={showLabels ? 'img' : undefined}
      aria-label={showLabels ? 'The BP Triangle: Stress, Sugar, and Sodium' : undefined}
      aria-hidden={showLabels ? undefined : true}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <polygon
        points="100,28 36,140 164,140"
        fill="none"
        stroke="var(--line, #D8CFBD)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {Object.entries(CORNERS).map(([key, c]) => {
        const hot = emphasis === key;
        return (
          <g key={key}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hot ? 7 : 4.5}
              fill={hot ? 'var(--clay, #B85A36)' : 'var(--sage, #4A5D4E)'}
            />
            {showLabels && (
              <text
                x={c.labelX}
                y={c.labelY}
                textAnchor={c.anchor}
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '13px',
                  fill: hot ? 'var(--clay, #B85A36)' : 'var(--muted, #5A5F52)',
                }}
              >
                {c.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
