import { useEffect, useState } from "react";

/**
 * The seven stages an upload actually goes through, revealed one at a time.
 *
 * The cadence is indicative — only the server knows when a stage really ends —
 * so the last stage never marks itself complete: it waits on the response. That
 * keeps the panel a description of the work rather than a fake progress bar.
 */
const STAGES = [
  "Abrindo o pacote do laudo",
  "Separando as topografias do logotipo",
  "Recortando a moldura branca de cada painel",
  "Invertendo o mapa de cores em pressão",
  "Medindo IRP, DCI e latência distal",
  "Codificando as deglutições no ConvNeXt",
  "Agregando pelo ramo Chicago e pelo Set Transformer",
];

const STEP_MS = 620;

interface PipelineProgressProps {
  filename: string;
}

export default function PipelineProgress({ filename }: PipelineProgressProps) {
  const [reached, setReached] = useState(0);

  useEffect(() => {
    setReached(0);
    const timer = window.setInterval(() => {
      setReached((current) => Math.min(current + 1, STAGES.length - 1));
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [filename]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass rounded-3xl p-8 sm:p-10"
      data-testid="pipeline-progress"
    >
      <p className="kicker mb-6">Analisando · {filename}</p>
      <ol className="flex flex-col gap-3.5">
        {STAGES.map((stage, index) => {
          const done = index < reached;
          const active = index === reached;
          return (
            <li
              key={stage}
              className={`flex items-center gap-3.5 text-sm transition-all duration-500 ${
                done ? "text-mist" : active ? "text-chalk" : "text-dim/50"
              }`}
              style={{ opacity: index <= reached + 1 ? 1 : 0.35 }}
            >
              <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                {done ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-signal" aria-hidden="true">
                    <path
                      d="M3 8.5l3.2 3.2L13 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : active ? (
                  <>
                    <span className="absolute h-4 w-4 animate-ping rounded-full bg-signal/30" />
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                  </>
                ) : (
                  <span className="h-1 w-1 rounded-full bg-current" />
                )}
              </span>
              {stage}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export { STAGES };
