import { useMemo } from "react";

import ReferenceImage from "./ReferenceImage";
import Reveal from "./Reveal";
import SchematicPlot from "./SchematicPlot";
import { alpha, percent } from "../lib/format";
import type { Disease, PerClassMetric } from "../types";

const METRIC_LABEL: Record<string, string> = {
  irp4: "IRP mediana",
  dci: "DCI",
  distal_latency: "Latência distal",
  pressurization: "Pressurização",
  egj_basal: "JEG basal",
};

interface DiseaseAtlasProps {
  diseases: Disease[];
  selected: string | null;
  onSelect: (slug: string) => void;
  perClass: PerClassMetric[] | null;
  highlight: string | null;
}

function List({ title, items, accent }: { title: string; items: string[]; accent?: string }) {
  return (
    <div>
      <h4 className="kicker mb-3" style={accent ? { color: accent } : undefined}>
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[0.925rem] leading-relaxed text-mist">
            <span
              aria-hidden="true"
              className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full"
              style={{ background: accent ?? "currentColor", opacity: accent ? 1 : 0.5 }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DiseaseAtlas({
  diseases,
  selected,
  onSelect,
  perClass,
  highlight,
}: DiseaseAtlasProps) {
  const active = useMemo(
    () => diseases.find((disease) => disease.slug === selected) ?? diseases[0],
    [diseases, selected],
  );
  const maxPrevalence = useMemo(
    () => Math.max(1, ...diseases.map((disease) => disease.prevalence)),
    [diseases],
  );
  const performance = perClass?.find((entry) => entry.slug === active?.slug) ?? null;

  if (!active) return null;

  return (
    <section id="atlas" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <Reveal>
          <header className="max-w-3xl">
            <p className="kicker mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-current opacity-50" />
              Atlas
            </p>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.04em]">
              Atlas dos oito diagnósticos
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-mist">
              Critérios da Classificação de Chicago v4.0, a assinatura de cada uma na topografia de
              pressão e um exemplo real da partição de teste.
            </p>
          </header>
        </Reveal>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Diagnósticos" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex flex-col">
              {diseases.map((disease) => {
                const isActive = disease.slug === active.slug;
                return (
                  <li key={disease.slug}>
                    <button
                      type="button"
                      onClick={() => onSelect(disease.slug)}
                      aria-current={isActive ? "true" : undefined}
                      className={`group w-full border-b hairline py-4 text-left transition-colors ${
                        isActive ? "text-chalk" : "text-mist hover:text-chalk"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full transition-transform duration-300"
                          style={{
                            background: disease.accent,
                            opacity: isActive ? 1 : 0.42,
                            transform: isActive ? "scale(1.35)" : "none",
                          }}
                        />
                        <span className="flex-1 text-[0.95rem] leading-tight">{disease.name}</span>
                        {highlight === disease.slug && (
                          <span className="kicker text-[0.5625rem] text-signal">deste exame</span>
                        )}
                      </span>
                      {/* Capped, or the bar stretches across a tablet-width
                          column and stops reading as a proportion. */}
                      <span className="mt-2.5 flex max-w-[240px] items-center gap-2 pl-5">
                        <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-chalk/6">
                          <span
                            className="block h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(disease.prevalence / maxPrevalence) * 100}%`,
                              background: alpha(disease.accent, isActive ? 0.9 : 0.4),
                            }}
                          />
                        </span>
                        <span className="numeral text-[0.6875rem] text-dim">{disease.prevalence}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-dim">
              A barra é o número de exames da classe no corpus de 1.681 estudos.
            </p>
          </nav>

          <article key={active.slug} className="min-w-0">
            <div
              className="relative overflow-hidden rounded-3xl border hairline p-8 sm:p-10"
              style={{
                background: `linear-gradient(150deg, ${alpha(active.accent, 0.10)}, rgba(9,11,18,0.7) 55%)`,
              }}
            >
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
                style={{ background: alpha(active.accent, 0.16) }}
              />
              <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
                <div className="min-w-0">
                  <p className="kicker" style={{ color: active.accent }}>
                    {active.family}
                  </p>
                  <h3 className="mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] font-medium leading-[1.04] tracking-[-0.035em]">
                    {active.name}
                  </h3>
                  <p className="mt-2 text-sm text-dim">{active.english}</p>
                  <p className="mt-5 text-lg leading-snug text-mist">{active.tagline}</p>
                  <p className="mt-6 text-[0.975rem] leading-relaxed text-mist">{active.summary}</p>

                  {performance && (
                    <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t hairline pt-6">
                      <div>
                        <dt className="kicker">sensibilidade no teste</dt>
                        <dd className="numeral mt-1 text-lg">{percent(performance.recall, 1)}</dd>
                      </div>
                      <div>
                        <dt className="kicker">precisão</dt>
                        <dd className="numeral mt-1 text-lg">{percent(performance.precision, 1)}</dd>
                      </div>
                      <div>
                        <dt className="kicker">F1</dt>
                        <dd className="numeral mt-1 text-lg">{performance.f1.toFixed(3)}</dd>
                      </div>
                      <div>
                        <dt className="kicker">exames no teste</dt>
                        <dd className="numeral mt-1 text-lg">{performance.support}</dd>
                      </div>
                    </dl>
                  )}
                </div>

                <ReferenceImage slug={active.slug} accent={active.accent} name={active.name} />
              </div>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div className="rounded-2xl border hairline bg-slab/30 p-7">
                <List title="Critérios · Chicago v4.0" items={active.criteria} accent={active.accent} />
              </div>

              <div className="rounded-2xl border hairline bg-slab/30 p-7">
                <h4 className="kicker mb-3" style={{ color: active.accent }}>
                  No traçado
                </h4>
                <p className="text-[0.925rem] leading-relaxed text-mist">{active.topography}</p>
                <div className="mt-5 flex items-center gap-5 border-t hairline pt-5">
                  <SchematicPlot
                    slug={active.slug}
                    accent={active.accent}
                    className="h-32 w-auto shrink-0"
                  />
                  <dl className="flex min-w-0 flex-col gap-2.5">
                    {Object.entries(active.metric_signature).map(([key, value]) => (
                      <div key={key}>
                        <dt className="kicker">{METRIC_LABEL[key] ?? key}</dt>
                        <dd className="mt-0.5 text-xs leading-snug text-mist">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="rounded-2xl border hairline bg-slab/30 p-7">
                <List title="Quadro clínico" items={active.symptoms} accent={active.accent} />
              </div>

              <div className="rounded-2xl border hairline bg-slab/30 p-7">
                <List title="Diagnóstico diferencial" items={active.differential} accent={active.accent} />
              </div>

              <div className="rounded-2xl border hairline bg-slab/30 p-7 sm:col-span-2">
                <h4 className="kicker mb-3" style={{ color: active.accent }}>
                  Conduta
                </h4>
                <p className="text-[0.925rem] leading-relaxed text-mist">{active.management}</p>
              </div>

              {active.caveat && (
                <aside className="rounded-2xl border border-ember/20 bg-ember/[0.05] p-7 sm:col-span-2">
                  <h4 className="kicker mb-3 text-ember">Ressalva</h4>
                  <p className="text-[0.925rem] leading-relaxed text-mist">{active.caveat}</p>
                </aside>
              )}

              <div className="sm:col-span-2">
                <h4 className="kicker mb-3">Referências</h4>
                <ul className="flex flex-col gap-2">
                  {active.references.map((reference) => (
                    <li key={reference} className="text-xs leading-relaxed text-dim">
                      {reference}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
