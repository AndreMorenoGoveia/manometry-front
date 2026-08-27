import { useState } from "react";

import { alpha, formatMetric, formatUnit, percent } from "../../lib/format";
import type { SwallowResult } from "../../types";

const PATTERN_TONE: Record<string, string> = {
  normal: "#34D399",
  weak: "#FBBF24",
  failed: "#94A3B8",
  fragmented: "#38BDF8",
  hypercontractile: "#F87171",
  premature: "#FB923C",
  panesophageal: "#E879F9",
};

const tone = (pattern: string) => PATTERN_TONE[pattern] ?? "#98a3ba";

interface SwallowStripProps {
  swallows: SwallowResult[];
}

export default function SwallowStrip({ swallows }: SwallowStripProps) {
  const [selected, setSelected] = useState(0);
  const active = swallows[Math.min(selected, swallows.length - 1)];

  return (
    <section className="rounded-3xl border hairline bg-slab/40 p-7 sm:p-9">
      <header className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h4 className="text-lg font-medium tracking-tight">As deglutições, uma a uma</h4>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
            Cada painel é a topografia já recortada — o mesmo recorte que o codificador recebeu.
            O padrão indicado é o da contratilidade da v4.0, derivado das métricas da própria imagem.
          </p>
        </div>
        <span className="kicker">clique para inspecionar</span>
      </header>

      <ul
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-4"
        data-testid="swallow-strip"
      >
        {swallows.map((swallow, index) => {
          const isActive = index === selected;
          const colour = tone(swallow.pattern);
          return (
            <li key={swallow.index} className="snap-start">
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={isActive}
                className="group relative block w-[104px] overflow-hidden rounded-xl border transition-all duration-300 sm:w-[124px]"
                style={{
                  borderColor: isActive ? colour : "rgba(238,242,248,0.10)",
                  boxShadow: isActive ? `0 0 0 1px ${colour}, 0 12px 36px ${alpha(colour, 0.22)}` : "none",
                  transform: isActive ? "translateY(-3px)" : "none",
                }}
              >
                {swallow.thumbnail ? (
                  <img
                    src={swallow.thumbnail}
                    alt={`Deglutição ${swallow.index}`}
                    loading="lazy"
                    className="aspect-[3/5] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[3/5] w-full bg-ridge" />
                )}
                <span
                  className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1.5 text-[0.625rem]"
                  style={{ background: "linear-gradient(transparent, rgba(5,6,10,0.92) 45%)" }}
                >
                  <span className="numeral text-chalk">{swallow.index}</span>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colour }} />
                </span>
                {!swallow.used && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-void/80 px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider text-dim">
                    fora
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {active && (
        <div className="mt-6 grid gap-8 border-t hairline pt-8 lg:grid-cols-[minmax(0,260px)_1fr]">
          <figure className="flex flex-col gap-3">
            {active.thumbnail ? (
              <img
                src={active.thumbnail}
                alt={`Topografia da deglutição ${active.index}`}
                className="w-full rounded-xl border hairline"
              />
            ) : (
              <div className="aspect-[3/4] w-full rounded-xl bg-ridge" />
            )}
            <figcaption className="text-xs leading-relaxed text-dim">
              Inversão de cor com {percent(active.colour_confidence)} dos pixels mapeados de volta
              para pressão.
            </figcaption>
          </figure>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: alpha(tone(active.pattern), 0.16),
                  color: tone(active.pattern),
                }}
              >
                {active.pattern_label}
              </span>
              <span className="kicker">deglutição {active.index}</span>
              {active.top_class && (
                <span className="text-xs text-dim">
                  cabeça por deglutição: {active.top_class.short_name} ·{" "}
                  {percent(active.top_class.probability, 1)}
                </span>
              )}
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">
              {active.pattern_description}
            </p>

            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {active.metrics.map((metric) => (
                <div key={metric.key} className="border-t hairline pt-3" title={metric.long}>
                  <dt className="kicker">{metric.label}</dt>
                  <dd className="numeral mt-1 text-base">
                    {formatMetric(metric.key, metric.value)}
                    {formatUnit(metric.unit) && (
                      <span className="ml-1 text-xs text-dim">{formatUnit(metric.unit)}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}

export { PATTERN_TONE };
