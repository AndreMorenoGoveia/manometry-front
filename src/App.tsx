import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiError, analyze, getDiseases, getHealth, getModelCard } from "./api";
import DiseaseAtlas from "./components/DiseaseAtlas";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Method from "./components/Method";
import Nav from "./components/Nav";
import PipelineProgress from "./components/PipelineProgress";
import Reveal from "./components/Reveal";
import Uploader from "./components/Uploader";
import ResultView from "./components/result/ResultView";
import { scrollToId, useSmoothScroll } from "./lib/useSmoothScroll";
import type { AnalysisResponse, Disease, Health, ModelCard } from "./types";

const DEFAULT_ACCENT = "#60e6c8";

type Stage =
  | { kind: "idle" }
  | { kind: "working"; filename: string }
  | { kind: "done"; result: AnalysisResponse }
  | { kind: "error"; message: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [model, setModel] = useState<ModelCard | null>(null);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [samples, setSamples] = useState<string[]>([]);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [atlasSlug, setAtlasSlug] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  useSmoothScroll();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    getHealth(signal).then(setHealth).catch(() => setHealth(null));
    getDiseases(signal)
      .then((list) => {
        setDiseases(list);
        setAtlasSlug((current) => current ?? list[0]?.slug ?? null);
      })
      .catch(() => setDiseases([]));
    // The model card needs the checkpoint in memory, so it is allowed to fail
    // quietly: the page is still worth reading without it.
    getModelCard(signal).then(setModel).catch(() => setModel(null));
    fetch("/api/samples", { signal })
      .then((response) => (response.ok ? response.json() : { available: [] }))
      .then((payload: { available?: string[] }) => setSamples(payload.available ?? []))
      .catch(() => setSamples([]));

    return () => controller.abort();
  }, []);

  useEffect(() => () => request.current?.abort(), []);

  const submit = useCallback((file: File) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStage({ kind: "working", filename: file.name });
    scrollToId("analise");

    analyze(file, controller.signal)
      .then((result) => {
        setStage({ kind: "done", result });
        setAtlasSlug(result.diagnosis.slug);
        setModel((current) => result.model_card ?? current);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof ApiError
            ? error.message
            : "Não foi possível falar com o servidor. Confira se a API está no ar.";
        setStage({ kind: "error", message });
      });
  }, []);

  const useSample = useCallback(
    async (slug: string) => {
      setLoadingSample(slug);
      try {
        const response = await fetch(`/api/sample-report?diagnosis=${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error("indisponível");
        const blob = await response.blob();
        submit(new File([blob], `laudo_exemplo_${slug}.docx`, { type: blob.type }));
      } catch {
        setStage({
          kind: "error",
          message: "O laudo de exemplo não pôde ser gerado: o corpus não está montado no servidor.",
        });
      } finally {
        setLoadingSample(null);
      }
    },
    [submit],
  );

  const openAtlas = useCallback((slug: string) => {
    setAtlasSlug(slug);
    scrollToId("atlas");
  }, []);

  const accent =
    stage.kind === "done" ? stage.result.diagnosis.accent : DEFAULT_ACCENT;

  const sampleLabel = useMemo(() => {
    const names = new Map(diseases.map((disease) => [disease.slug, disease.short_name]));
    return (slug: string) => names.get(slug) ?? slug;
  }, [diseases]);

  const orderedSamples = useMemo(
    () => diseases.map((disease) => disease.slug).filter((slug) => samples.includes(slug)),
    [diseases, samples],
  );

  return (
    <>
      <a
        href="#analise"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-chalk focus:px-5 focus:py-2.5 focus:text-sm focus:text-void"
      >
        Ir para a análise
      </a>

      <Nav health={health} />

      <main>
        <Hero accent={accent} model={model} />

        <section id="analise" className="relative scroll-mt-24 border-t hairline py-28 sm:py-36">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <Reveal>
              <header className="mb-14 max-w-3xl">
                <p className="kicker mb-6 flex items-center gap-3">
                  <span className="h-px w-10 bg-current opacity-50" />
                  Análise
                </p>
                <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.04em]">
                  Envie o laudo,
                  <span className="font-serif italic font-normal"> leia o raciocínio</span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-mist">
                  O arquivo não é gravado: as imagens são extraídas em memória, recortadas, medidas e
                  descartadas assim que a resposta sai.
                </p>
              </header>
            </Reveal>

            {stage.kind === "working" ? (
              <PipelineProgress filename={stage.filename} />
            ) : stage.kind === "done" ? (
              <ResultView
                result={stage.result}
                onReset={() => setStage({ kind: "idle" })}
                onOpenAtlas={openAtlas}
              />
            ) : (
              <div className="flex flex-col gap-5">
                {stage.kind === "error" && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-alarm/25 bg-alarm/[0.06] p-6"
                  >
                    <p className="kicker mb-2 text-alarm">não foi possível analisar</p>
                    <p className="text-sm leading-relaxed text-mist">{stage.message}</p>
                  </div>
                )}
                {health && !health.model_available && (
                  <div className="rounded-2xl border border-ember/25 bg-ember/[0.06] p-6">
                    <p className="kicker mb-2 text-ember">modelo indisponível</p>
                    <p className="text-sm leading-relaxed text-mist">
                      A API está no ar, mas não encontrou o checkpoint em{" "}
                      <code className="numeral text-xs text-chalk">{health.checkpoint}</code>. Aponte{" "}
                      <code className="numeral text-xs text-chalk">
                        MANOMETRY_CLASSIFICATION_ROOT
                      </code>{" "}
                      para o checkout de manometry-classification.
                    </p>
                  </div>
                )}
                <Uploader
                  onSubmit={submit}
                  samples={orderedSamples}
                  sampleLabel={sampleLabel}
                  onSample={useSample}
                  loadingSample={loadingSample}
                  disabled={health != null && !health.model_available}
                />
              </div>
            )}
          </div>
        </section>

        {diseases.length > 0 && (
          <DiseaseAtlas
            diseases={diseases}
            selected={atlasSlug}
            onSelect={setAtlasSlug}
            perClass={model?.per_class ?? null}
            highlight={stage.kind === "done" ? stage.result.diagnosis.slug : null}
          />
        )}

        <Method model={model} />
      </main>

      <Footer />
    </>
  );
}
