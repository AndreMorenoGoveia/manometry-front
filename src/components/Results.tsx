import Reveal from "./Reveal";
import { count, percent } from "../lib/format";
import type { Disease, ModelCard } from "../types";

interface ResultsProps {
  model: ModelCard | null;
  diseases: Disease[];
}

export default function Results({ model, diseases }: ResultsProps) {
  const perClass = model?.per_class ?? null;
  const test = model?.test_metrics;
  const exams = model?.exam_counts?.test ?? null;

  const rows = (perClass ?? [])
    .map((entry) => {
      const disease = diseases.find((item) => item.slug === entry.slug);
      return { ...entry, name: disease?.name ?? entry.slug, accent: disease?.accent ?? "#98a3ba" };
    })
    .sort((a, b) => b.support - a.support);

  return (
    <section id="resultados" className="relative scroll-mt-24 border-t hairline py-28 sm:py-36">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
        <Reveal>
          <header className="max-w-3xl">
            <p className="kicker mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-current opacity-50" />
              Resultados
            </p>
            <h2 className="text-[clamp(1.9rem,4.4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Acerto por classe na partição de teste
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-mist">
              {exams != null
                ? `Medido em ${count(exams)} exames que o modelo nunca viu, com partição por paciente.`
                : "Medido na partição de teste do treino, com partição por paciente."}{" "}
              Sensibilidade é a fração dos exames da classe que o modelo reconheceu.
            </p>
          </header>
        </Reveal>

        {rows.length === 0 ? (
          <Reveal>
            <p className="mt-12 rounded-2xl border hairline bg-slab/30 p-7 text-sm text-mist">
              O desempenho por classe aparece quando a API consegue ler as previsões guardadas
              junto do checkpoint.
            </p>
          </Reveal>
        ) : (
          <Reveal>
            <div className="mt-14 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b hairline">
                    <th className="kicker pb-4 pr-4 font-normal">diagnóstico</th>
                    <th className="kicker pb-4 pr-4 text-right font-normal">exames</th>
                    <th className="kicker pb-4 pr-4 text-right font-normal">sensibilidade</th>
                    <th className="kicker pb-4 pr-4 text-right font-normal">precisão</th>
                    <th className="kicker w-[26%] pb-4 font-normal">F1</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.slug} className="border-b hairline">
                      <td className="py-4 pr-4">
                        <span className="flex items-center gap-3">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: row.accent }}
                          />
                          <span className="text-[0.95rem] text-chalk">{row.name}</span>
                        </span>
                      </td>
                      <td className="numeral py-4 pr-4 text-right text-sm text-mist">
                        {row.support}
                      </td>
                      <td className="numeral py-4 pr-4 text-right text-sm text-chalk">
                        {percent(row.recall, 1)}
                      </td>
                      <td className="numeral py-4 pr-4 text-right text-sm text-mist">
                        {percent(row.precision, 1)}
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-3">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-chalk/6">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${Math.max(row.f1, 0.01) * 100}%`,
                                background: row.accent,
                              }}
                            />
                          </span>
                          <span className="numeral w-11 shrink-0 text-right text-xs text-mist">
                            {row.f1.toFixed(2)}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}

        {test?.accuracy != null && (
          <Reveal delay={80}>
            <p className="mt-8 text-sm leading-relaxed text-dim">
              No conjunto das oito classes o modelo acerta {percent(test.accuracy, 1)} dos exames.
              As classes raras puxam a média para baixo, e é por isso que a tabela vem antes do
              número único.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
