import { alpha, duration, percent } from "../../lib/format";
import { useAfterMount } from "../../lib/useAfterMount";
import type { AnalysisResponse } from "../../types";

function Gauge({ value, accent }: { value: number; accent: string }) {
  const mounted = useAfterMount();
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (mounted ? Math.max(0, Math.min(1, value)) : 0) * circumference;
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90" role="img" aria-label={`Confiança ${percent(value)}`}>
      <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-chalk/8" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference - filled}`}
        style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

interface DiagnosisCardProps {
  result: AnalysisResponse;
  onOpenAtlas: (slug: string) => void;
}

export default function DiagnosisCard({ result, onOpenAtlas }: DiagnosisCardProps) {
  const { diagnosis, study, panels } = result;
  const runner = result.ranking[1];

  return (
    <article
      className="relative overflow-hidden rounded-3xl border hairline p-8 sm:p-12"
      style={{
        background: `linear-gradient(140deg, ${alpha(diagnosis.accent, 0.14)}, rgba(15,20,32,0.6) 46%, rgba(9,11,18,0.9))`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: alpha(diagnosis.accent, 0.18) }}
      />
      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="kicker" style={{ color: diagnosis.accent }}>
            {diagnosis.family}
          </p>
          <h3 className="mt-4 text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.04em]">
            {diagnosis.name}
          </h3>
          <p className="mt-3 text-lg leading-snug text-mist sm:text-xl">{diagnosis.tagline}</p>
          <p className="mt-6 text-[0.975rem] leading-relaxed text-mist">{diagnosis.summary}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAtlas(diagnosis.slug)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-void transition-transform duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: diagnosis.accent }}
            >
              Ler sobre a doença
              <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
                <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {runner && (
              <span className="rounded-full border hairline px-4 py-2.5 text-xs text-mist">
                2ª hipótese: {runner.short_name} · {percent(runner.probability, 1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <div className="relative">
            <Gauge value={diagnosis.probability} accent={diagnosis.accent} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="numeral text-2xl font-light leading-none">
                {percent(diagnosis.probability, 1)}
              </span>
              <span className="kicker mt-1 text-[0.5625rem]">confiança</span>
            </div>
          </div>
          <dl className="flex flex-col gap-4 border-l hairline pl-6">
            <div>
              <dt className="kicker">deglutições lidas</dt>
              <dd className="numeral mt-1 text-lg">
                {study.swallows}
                <span className="text-dim"> / {panels.total} painéis</span>
              </dd>
            </div>
            <div>
              <dt className="kicker">IRP mediana</dt>
              <dd className="numeral mt-1 text-lg">
                {study.median_irp4.toFixed(1)} <span className="text-dim">mmHg</span>
              </dd>
            </div>
            <div>
              <dt className="kicker">tempo de análise</dt>
              <dd className="numeral mt-1 text-lg">{duration(result.elapsed_ms)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
