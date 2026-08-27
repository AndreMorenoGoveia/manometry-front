import ChicagoLadder from "./ChicagoLadder";
import DiagnosisCard from "./DiagnosisCard";
import Ranking from "./Ranking";
import StudyMetrics from "./StudyMetrics";
import SwallowStrip from "./SwallowStrip";
import Reveal from "../Reveal";
import type { AnalysisResponse } from "../../types";

interface ResultViewProps {
  result: AnalysisResponse;
  onReset: () => void;
  onOpenAtlas: (slug: string) => void;
}

export default function ResultView({ result, onReset, onOpenAtlas }: ResultViewProps) {
  return (
    <div className="flex flex-col gap-6" data-testid="result-view">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="kicker truncate">
          Laudo · <span className="text-mist normal-case tracking-normal">{result.filename}</span>
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border hairline px-4 py-2 text-xs text-mist transition-colors hover:border-chalk/30 hover:text-chalk"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
            <path
              d="M13 8a5 5 0 1 1-1.5-3.6M13 2v3h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Analisar outro laudo
        </button>
      </div>

      <Reveal>
        <DiagnosisCard result={result} onOpenAtlas={onOpenAtlas} />
      </Reveal>

      {result.warnings.length > 0 && (
        <Reveal delay={60}>
          <aside className="rounded-2xl border border-ember/20 bg-ember/[0.05] p-6">
            <p className="kicker mb-3 text-ember">observações sobre a leitura</p>
            <ul className="flex flex-col gap-2">
              {result.warnings.map((note) => (
                <li key={note} className="flex gap-2.5 text-sm leading-relaxed text-mist">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember" />
                  {note}
                </li>
              ))}
            </ul>
          </aside>
        </Reveal>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={80}>
          <Ranking ranking={result.ranking} />
        </Reveal>
        <Reveal delay={120}>
          <ChicagoLadder gates={result.study.gates} />
        </Reveal>
      </div>

      <Reveal delay={80}>
        <StudyMetrics study={result.study} />
      </Reveal>

      <Reveal delay={80}>
        <SwallowStrip swallows={result.swallows} />
      </Reveal>

      <p className="mt-2 rounded-2xl border hairline bg-slab/30 p-6 text-xs leading-relaxed text-dim">
        Ferramenta de apoio à decisão e de pesquisa. A classificação e as métricas exibidas são
        estimadas a partir das imagens do laudo e não substituem a leitura do exame por um médico
        habilitado nem a análise dos traçados originais.
      </p>
    </div>
  );
}
