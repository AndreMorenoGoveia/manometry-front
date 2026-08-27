import { alpha } from "../lib/format";

/**
 * A stylised topography for each diagnosis: axial position down, time across,
 * the contractile front drawn as a band and the junction as a standing bar.
 *
 * It is a diagram, not data — it exists so the reference page can state the
 * pattern even when the corpus (and therefore the real example image) is not
 * mounted, and so the reader has a legend to compare a real plot against.
 */

type Wave = "diagonal" | "broken" | "vertical" | "thick" | "block" | "none";
type Junction = "relaxing" | "tight" | "weak" | "split";

const SIGNATURES: Record<string, { wave: Wave; junction: Junction }> = {
  normal_motility: { wave: "diagonal", junction: "relaxing" },
  ineffective_esophageal_motility: { wave: "broken", junction: "relaxing" },
  hypotensive_egj: { wave: "diagonal", junction: "split" },
  absent_contractility: { wave: "none", junction: "weak" },
  achalasia_type_i: { wave: "none", junction: "tight" },
  achalasia_type_ii: { wave: "block", junction: "tight" },
  distal_esophageal_spasm: { wave: "vertical", junction: "relaxing" },
  hypercontractile_esophagus: { wave: "thick", junction: "relaxing" },
};

const TOP = 34;      // upper sphincter
const BOTTOM = 214;  // junction
const LEFT = 26;
const RIGHT = 188;

function wavePath(kind: Wave): { d: string; width: number; dash?: string }[] {
  switch (kind) {
    case "diagonal":
      return [{ d: `M ${LEFT + 8} ${TOP + 14} C 70 92, 96 140, ${RIGHT - 34} ${BOTTOM - 12}`, width: 13 }];
    case "broken":
      return [
        { d: `M ${LEFT + 8} ${TOP + 14} C 62 74, 74 96, 92 112`, width: 9 },
        { d: `M 124 148 C 138 172, 146 190, ${RIGHT - 34} ${BOTTOM - 12}`, width: 7 },
      ];
    case "vertical":
      return [{ d: `M ${LEFT + 40} ${TOP + 18} C 84 90, 88 150, 96 ${BOTTOM - 10}`, width: 12 }];
    case "thick":
      return [
        { d: `M ${LEFT + 10} ${TOP + 16} C 74 96, 100 142, ${RIGHT - 30} ${BOTTOM - 12}`, width: 26 },
        { d: `M ${LEFT + 26} ${TOP + 22} C 92 100, 118 146, ${RIGHT - 16} ${BOTTOM - 16}`, width: 14 },
      ];
    case "block":
      return [];
    case "none":
    default:
      return [];
  }
}

interface SchematicPlotProps {
  slug: string;
  accent: string;
  className?: string;
}

export default function SchematicPlot({ slug, accent, className = "" }: SchematicPlotProps) {
  const signature = SIGNATURES[slug] ?? { wave: "diagonal", junction: "relaxing" };
  const bands = wavePath(signature.wave);
  const gradientId = `schematic-${slug}`;

  const junction = {
    relaxing: { height: 8, opacity: 0.45, gap: true },
    tight: { height: 16, opacity: 1, gap: false },
    weak: { height: 5, opacity: 0.3, gap: true },
    split: { height: 6, opacity: 0.5, gap: true },
  }[signature.junction];

  return (
    <svg
      viewBox="0 0 210 250"
      className={className}
      role="img"
      aria-label={`Assinatura esquemática de ${slug} na topografia de pressão`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <rect x={LEFT} y={20} width={RIGHT - LEFT} height={210} rx="6" fill={alpha(accent, 0.05)} />
      {[0, 1, 2, 3, 4].map((step) => (
        <line
          key={step}
          x1={LEFT + ((RIGHT - LEFT) / 4) * step}
          y1={20}
          x2={LEFT + ((RIGHT - LEFT) / 4) * step}
          y2={230}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-chalk/8"
        />
      ))}

      {/* Upper oesophageal sphincter: always present, always relaxing on swallow. */}
      <rect x={LEFT} y={TOP - 8} width={RIGHT - LEFT} height="7" rx="3" fill={alpha(accent, 0.5)} />

      {/* Pan-oesophageal pressurization fills the whole body at once. */}
      {signature.wave === "block" && (
        <rect
          x={LEFT + 34}
          y={TOP + 12}
          width={RIGHT - LEFT - 60}
          height={BOTTOM - TOP - 24}
          rx="4"
          fill={`url(#${gradientId})`}
          opacity="0.62"
        />
      )}

      {bands.map((band, index) => (
        <path
          key={index}
          d={band.d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={band.width}
          strokeLinecap="round"
          opacity={index === 0 ? 0.9 : 0.55}
        />
      ))}

      {signature.wave === "none" && (
        <line
          x1={LEFT + 12}
          y1={(TOP + BOTTOM) / 2}
          x2={RIGHT - 12}
          y2={(TOP + BOTTOM) / 2}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 5"
          className="text-chalk/25"
        />
      )}

      {/* The junction. A tight one never breaks; a split one shows two bands. */}
      <rect
        x={LEFT}
        y={BOTTOM}
        width={junction.gap ? (RIGHT - LEFT) * 0.36 : RIGHT - LEFT}
        height={junction.height}
        rx="3"
        fill={accent}
        opacity={junction.opacity}
      />
      {junction.gap && (
        <rect
          x={LEFT + (RIGHT - LEFT) * 0.74}
          y={BOTTOM}
          width={(RIGHT - LEFT) * 0.26}
          height={junction.height}
          rx="3"
          fill={accent}
          opacity={junction.opacity}
        />
      )}
      {signature.junction === "split" && (
        <rect
          x={LEFT}
          y={BOTTOM + junction.height + 6}
          width={(RIGHT - LEFT) * 0.36}
          height="4"
          rx="2"
          fill={accent}
          opacity="0.35"
        />
      )}

      <text x={4} y={TOP - 12} className="fill-current text-dim" fontSize="7" fontFamily="var(--font-mono)">
        EES
      </text>
      <text x={4} y={BOTTOM + 8} className="fill-current text-dim" fontSize="7" fontFamily="var(--font-mono)">
        JEG
      </text>
      <text x={LEFT} y={244} className="fill-current text-dim" fontSize="7" fontFamily="var(--font-mono)">
        tempo →
      </text>
    </svg>
  );
}

export { SIGNATURES };
