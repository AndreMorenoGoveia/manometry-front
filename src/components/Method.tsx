import Reveal from "./Reveal";
import { number, percent } from "../lib/format";
import type { ModelCard } from "../types";

const STEPS = [
  {
    title: "Leitura do laudo",
    body: "Os PNG embutidos são lidos na ordem em que o documento os referencia — pelas relações do pacote OOXML no .docx, pela sequência de \\pngblip no .rtf. Uma figura repetida conta uma vez só.",
  },
  {
    title: "Logotipo fora, deglutições dentro",
    body: "O cabeçalho do serviço é a única imagem em paisagem; os painéis de topografia são retrato. A orientação separa os dois sem depender de nome de arquivo nem de posição.",
  },
  {
    title: "Recorte da moldura",
    body: "A escala de mmHg, o cabeçalho e o eixo de tempo são branco quase puro; o gráfico é um bloco largo de pixels escuros. A maior sequência contígua de linhas e colunas escuras é o gráfico. É o mesmo código que construiu o dataset — nenhum pixel do traçado é alterado.",
  },
  {
    title: "Cor de volta a pressão",
    body: "O export não traz barra de cor, então a rampa jet é invertida por tabela e ancorada numa calibração global ajustada apenas em exames normais de treino. Sai uma matriz de 24 sensores × 241 amostras por deglutição.",
  },
  {
    title: "Métricas de Chicago",
    body: "DCI, IRP de 4 s, latência distal, maior quebra do contorno de 20 mmHg e pressurização panesofágica saem dessa matriz, com as definições da v4.0. São proxies calibrados na imagem, não medidas do aparelho.",
  },
  {
    title: "Codificação das imagens",
    body: "Cada deglutição vai a 224 px por um ConvNeXt-Base pré-treinado em ImageNet-22k, ajustado com decaimento de taxa por camada, profundidade estocástica e média móvel dos pesos.",
  },
  {
    title: "Agregação do estudo",
    body: "Um ramo resume as posteriores por deglutição junto das métricas de Chicago; o outro é um Set Transformer sobre os embeddings, invariante à ordem das deglutições. Os dois se concatenam num único classificador de oito saídas.",
  },
];

const LIMITS = [
  "A partição é por paciente: nenhuma deglutição de um mesmo exame aparece em treino e teste ao mesmo tempo. Quando a partição é feita por deglutição, o macro-F1 do mesmo encoder salta acima de 0,90 — um número que não se sustenta na clínica.",
  "Duas classes da v4.0 ficaram de fora por falta de exames para uma divisão em três partes: obstrução da saída da JEG (n=12) e acalásia tipo III (n=5).",
  "As métricas mostradas são recuperadas da imagem renderizada, não lidas do sistema de aquisição. Servem para justificar a decisão, não para laudar.",
  "A v4.0 exige contexto clínico para fechar hipercontratilidade e espasmo distal. Uma imagem não carrega esse contexto.",
];

interface MethodProps {
  model: ModelCard | null;
}

export default function Method({ model }: MethodProps) {
  const test = model?.test_metrics;
  const validation = model?.val_metrics;

  return (
    <section id="metodo" className="relative scroll-mt-24 border-t hairline py-28 sm:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <Reveal>
          <header className="max-w-3xl">
            <p className="kicker mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-current opacity-50" />
              Método
            </p>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.04em]">
              Do arquivo ao diagnóstico,
              <span className="font-serif italic font-normal"> sem atalhos</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-mist">
              Sete passos entre o laudo e a classe. O recorte e as métricas usam literalmente o mesmo
              código que construiu o corpus e treinou os pesos, para que a inferência veja o que o
              treino viu.
            </p>
          </header>
        </Reveal>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-3xl border hairline bg-chalk/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 45} as="li" className="bg-ink p-7">
              <span className="numeral text-xs text-dim">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[1.05rem] font-medium leading-snug tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">{step.body}</p>
            </Reveal>
          ))}
          <Reveal delay={STEPS.length * 45} as="li" className="bg-ink p-7">
            <span className="numeral text-xs text-dim">08</span>
            <h3 className="mt-4 text-[1.05rem] font-medium leading-snug tracking-tight">
              Leitura humana
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              A saída é uma hipótese com os números que a sustentam. Quem lauda o exame é o médico.
            </p>
          </Reveal>
        </ol>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal>
            <div className="h-full rounded-3xl border hairline bg-slab/30 p-8">
              <h3 className="text-lg font-medium tracking-tight">O modelo que respondeu</h3>
              <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <dt className="kicker">codificador</dt>
                  <dd className="mt-1.5 text-sm">{model?.encoder ?? "—"}</dd>
                </div>
                <div>
                  <dt className="kicker">agregação</dt>
                  <dd className="mt-1.5 text-sm">{model?.fusion ?? "—"}</dd>
                </div>
                <div>
                  <dt className="kicker">época escolhida</dt>
                  <dd className="numeral mt-1.5 text-sm">
                    {model?.selected_epoch ?? "—"}
                    {model?.selected_weights ? ` · pesos ${model.selected_weights}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="kicker">semente</dt>
                  <dd className="numeral mt-1.5 text-sm">{model?.seed ?? "—"}</dd>
                </div>
                <div>
                  <dt className="kicker">execução</dt>
                  <dd className="mt-1.5 text-sm">{model?.device ?? "—"}</dd>
                </div>
                <div>
                  <dt className="kicker">deglutições por exame</dt>
                  <dd className="numeral mt-1.5 text-sm">até {model?.max_swallows ?? 10}</dd>
                </div>
              </dl>

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t hairline pt-7 sm:grid-cols-4">
                <div>
                  <dt className="kicker">macro-F1</dt>
                  <dd className="numeral mt-1.5 text-xl font-light">
                    {test?.macro_f1 != null ? number(test.macro_f1, 3) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="kicker">acurácia</dt>
                  <dd className="numeral mt-1.5 text-xl font-light">
                    {test?.accuracy != null ? percent(test.accuracy, 1) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="kicker">kappa</dt>
                  <dd className="numeral mt-1.5 text-xl font-light">
                    {test?.kappa != null ? number(test.kappa, 3) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="kicker">AUROC</dt>
                  <dd className="numeral mt-1.5 text-xl font-light">
                    {test?.auroc_ovr != null ? number(test.auroc_ovr, 3) : "—"}
                  </dd>
                </div>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-dim">
                Medido nos {model?.exam_counts?.test ?? "—"} exames de teste. A escolha de época, de
                pesos e do uso de recortes múltiplos foi feita nos{" "}
                {model?.exam_counts?.val ?? "—"} exames de validação
                {validation?.macro_f1 != null
                  ? ` (macro-F1 ${number(validation.macro_f1, 3)})`
                  : ""}
                , nunca no teste.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="h-full rounded-3xl border hairline bg-slab/30 p-8">
              <h3 className="text-lg font-medium tracking-tight">O que este número não é</h3>
              <ul className="mt-7 flex flex-col gap-5">
                {LIMITS.map((limit) => (
                  <li key={limit} className="flex gap-3.5 text-sm leading-relaxed text-mist">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember" />
                    {limit}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
