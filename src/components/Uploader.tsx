import { useCallback, useEffect, useRef, useState } from "react";

import { bytes } from "../lib/format";

const ACCEPTED = [".docx", ".rtf"];

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED.some((suffix) => name.endsWith(suffix));
}

interface UploaderProps {
  onSubmit: (file: File) => void;
  disabled?: boolean;
  /** The server is booting: say so, kindly, instead of greying the zone out. */
  warming?: boolean;
  samples: string[];
  sampleLabel: (slug: string) => string;
  onSample: (slug: string) => void;
  loadingSample: string | null;
}

export default function Uploader({
  onSubmit,
  disabled = false,
  warming = false,
  samples,
  sampleLabel,
  onSample,
  loadingSample,
}: UploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Drag events fire for every child element, so nesting has to be counted.
  const depth = useRef(0);
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    if (!warming) return;
    setWaited(0);
    const started = Date.now();
    const timer = setInterval(() => setWaited(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [warming]);

  const accept = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!isAccepted(file)) {
        setRejected(`“${file.name}” não é um laudo .docx ou .rtf.`);
        return;
      }
      setRejected(null);
      onSubmit(file);
    },
    [onSubmit],
  );

  useEffect(() => {
    // The browser navigates away from the page if a file is dropped outside the
    // zone, which would throw away an analysis in progress.
    const swallow = (event: DragEvent) => event.preventDefault();
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    return () => {
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div
        data-testid="dropzone"
        data-dragging={dragging}
        onDragEnter={(event) => {
          event.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          depth.current = 0;
          setDragging(false);
          if (!disabled) accept(event.dataTransfer.files);
        }}
        className={`group relative overflow-hidden rounded-3xl border border-dashed p-10 transition-all duration-500 sm:p-14 ${
          dragging
            ? "border-signal/70 bg-signal/[0.06]"
            : "border-chalk/12 bg-slab/40 hover:border-chalk/25"
        } ${disabled ? "pointer-events-none" : ""} ${disabled && !warming ? "opacity-50" : ""}`}
        aria-busy={warming}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(96,230,200,0.10), transparent 70%)",
          }}
        />
        {warming ? (
          <WarmingUp waited={waited} />
        ) : (
          <div className="relative flex flex-col items-center gap-6 text-center">
            <svg viewBox="0 0 64 40" className="h-12 w-20 text-signal" aria-hidden="true">
              <path
                d="M2 30c6 0 7-20 13-20s7 20 13 20 5-12 10-12 6 6 10 6 8-4 14-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M2 36h60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.25"
                strokeDasharray="2 4"
              />
            </svg>
            <div>
              <p className="text-xl font-medium tracking-tight sm:text-2xl">
                Arraste o laudo aqui
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist">
                .docx ou .rtf com as topografias das dez deglutições de água. O arquivo é lido em
                memória e não é gravado no servidor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-chalk px-6 py-3 text-sm font-medium text-void transition-transform duration-300 hover:-translate-y-0.5"
            >
              Escolher arquivo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".docx,.rtf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf"
              className="sr-only"
              aria-label="Laudo de manometria"
              onChange={(event) => {
                accept(event.target.files);
                event.target.value = "";
              }}
            />
            {rejected && (
              <p role="alert" className="text-sm text-alarm">
                {rejected}
              </p>
            )}
          </div>
        )}
      </div>

      {samples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="kicker mr-1">Sem um laudo à mão?</span>
          {samples.map((slug) => (
            <button
              key={slug}
              type="button"
              disabled={disabled || loadingSample !== null}
              onClick={() => onSample(slug)}
              className="rounded-full border hairline px-3.5 py-1.5 text-xs text-mist transition-colors hover:border-chalk/30 hover:text-chalk disabled:opacity-40"
            >
              {loadingSample === slug ? "preparando…" : sampleLabel(slug)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TRACE = "M2 30c6 0 7-20 13-20s7 20 13 20 5-12 10-12 6 6 10 6 8-4 14-4";

function WarmingUp({ waited }: { waited: number }) {
  const slow = waited >= 45;
  return (
    <div className="relative flex flex-col items-center gap-6 text-center" role="status" aria-live="polite">
      <svg viewBox="0 0 64 40" className="h-12 w-20 text-signal" aria-hidden="true">
        <path d={TRACE} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.18" />
        {/* A contraction front running down the trace, the way it runs down the esophagus. */}
        <path
          d={TRACE}
          pathLength={100}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="22 78"
          className="warmup-trace"
        />
        <path d="M2 36h60" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" strokeDasharray="2 4" />
      </svg>
      <div>
        <p className="text-xl font-medium tracking-tight sm:text-2xl">Preparando o modelo…</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist">
          {slow
            ? "Está demorando mais que o normal. Pode manter a página aberta: o envio é liberado sozinho assim que o servidor responder."
            : "O servidor descansa quando ninguém está usando e leva uns 30 segundos para acordar. O envio é liberado sozinho; enquanto isso, dê uma olhada no atlas abaixo."}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col items-center gap-2.5">
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-chalk/[0.07]">
          <div className="warmup-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-signal/70" />
        </div>
        <span className="numeral text-xs text-dim">{waited > 0 ? `${waited} s` : "\u00a0"}</span>
      </div>
    </div>
  );
}

export { isAccepted, bytes as formatBytes };
