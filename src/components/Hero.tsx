import TopographyField from "./TopographyField";
import type { Disease } from "../types";

interface HeroProps {
  accent: string;
  diseases: Disease[];
}

export default function Hero({ accent, diseases }: HeroProps) {
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
            <h1 className="text-[clamp(2.4rem,6.4vw,5.4rem)] font-medium leading-[1.0] tracking-[-0.045em]">
              Classificação de Chicago v4.0
              <br />
              <span className="text-mist">por inteligência artificial</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-mist sm:text-xl">
              Envie o laudo da manometria. O sistema recorta as topografias de pressão das dez
              deglutições, recupera os parâmetros de Chicago da própria imagem e devolve o
              diagnóstico do exame com os números que sustentam cada critério.
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

        {diseases.length > 0 && (
          <div className="mt-16 border-t hairline pt-8">
            <p className="kicker mb-5">Classes reconhecidas</p>
            <ul className="flex flex-wrap gap-x-7 gap-y-3">
              {diseases.map((disease) => (
                <li key={disease.slug} className="flex items-center gap-2.5 text-sm text-mist">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: disease.accent }}
                  />
                  {disease.short_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
