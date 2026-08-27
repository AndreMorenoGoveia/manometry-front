import TopographyField from "./TopographyField";
import { count, number, percent } from "../lib/format";
import type { ModelCard } from "../types";

interface HeroProps {
  accent: string;
  model: ModelCard | null;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="numeral text-2xl font-light tracking-tight text-chalk sm:text-3xl">
        {value}
      </span>
      <span className="kicker">{label}</span>
    </div>
  );
}

export default function Hero({ accent, model }: HeroProps) {
  const test = model?.test_metrics;
  const exams = model?.exam_counts;
  const total = exams ? Object.values(exams).reduce((sum, value) => sum + value, 0) : null;

  return (
    <section id="topo" className="relative min-h-[100svh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <TopographyField accent={accent} intensity={0.92} />
      </div>
      {/* Two scrims: one seats the field inside the page, one darkens the
          column the headline occupies so the type keeps its contrast wherever
          the peristaltic band happens to be. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(130% 95% at 50% 6%, transparent 22%, rgba(5,6,10,0.66) 68%, #05060a 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, rgba(5,6,10,0.86) 0%, rgba(5,6,10,0.62) 38%, rgba(5,6,10,0.12) 66%, transparent 100%)",
        }}
      />
      <div className="grain pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-between px-6 pb-10 pt-28 lg:px-10">
        <div className="flex flex-1 items-center">
          <div className="max-w-4xl">
            <p className="kicker mb-8 flex items-center gap-3">
              <span className="h-px w-10 bg-current opacity-50" />
              Manometria esofágica de alta resolução
            </p>
            <h1 className="text-[clamp(2.75rem,8vw,7rem)] font-medium leading-[0.92] tracking-[-0.045em]">
              Dez deglutições,
              <br />
              <span className="font-serif italic font-normal tracking-[-0.02em] text-signal">
                um diagnóstico.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-mist sm:text-xl">
              Envie o laudo do exame. O sistema recorta as topografias de pressão exatamente como o
              corpus de treino foi construído, recupera as métricas de Chicago da própria imagem e
              devolve a classificação do estudo — com os números que abriram cada porta da árvore de
              decisão.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#analise"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-chalk px-7 py-3.5 text-[0.95rem] font-medium text-void transition-transform duration-300 hover:-translate-y-0.5"
              >
                Enviar um laudo
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    d="M2 8h11M9 4l4 4-4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="#atlas"
                className="inline-flex items-center gap-2 rounded-full border hairline px-6 py-3.5 text-[0.95rem] text-mist transition-colors hover:border-chalk/30 hover:text-chalk"
              >
                Atlas das oito classes
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t hairline pt-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-16">
            <Stat
              value={test?.macro_f1 != null ? number(test.macro_f1, 3) : "—"}
              label="macro-F1 no teste"
            />
            <Stat
              value={test?.balanced_accuracy != null ? percent(test.balanced_accuracy, 1) : "—"}
              label="acurácia balanceada"
            />
            <Stat
              value={test?.auroc_ovr != null ? number(test.auroc_ovr, 3) : "—"}
              label="AUROC um-contra-resto"
            />
            <Stat
              value={total != null ? count(total) : "—"}
              label="exames · partição por paciente"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
