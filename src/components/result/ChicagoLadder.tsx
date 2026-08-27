import type { StudyGate } from "../../types";

interface ChicagoLadderProps {
  gates: StudyGate[];
}

/**
 * The CC v4.0 decision gates, each with the number that opened or closed it.
 *
 * The network is not a decision tree and does not literally walk this ladder;
 * these are the same study-level statistics its Chicago branch consumes, shown
 * so a reader can check the verdict against the criteria they would apply.
 */
export default function ChicagoLadder({ gates }: ChicagoLadderProps) {
  return (
    <section className="rounded-3xl border hairline bg-slab/40 p-7 sm:p-9">
      <header className="mb-7">
        <h4 className="text-lg font-medium tracking-tight">Portas da Classificação de Chicago</h4>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Critérios da v4.0 aplicados às métricas recuperadas da imagem. São proxies
          calibrados na cor do gráfico, não medidas do sistema de aquisição.
        </p>
      </header>
      <ul className="flex flex-col">
        {gates.map((gate, index) => (
          <li
            key={gate.key}
            className={`flex items-start gap-4 py-4 ${index > 0 ? "border-t hairline" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] ${
                gate.open
                  ? "border-signal/50 bg-signal/12 text-signal"
                  : "border-chalk/10 bg-chalk/[0.03] text-dim"
              }`}
            >
              {gate.open ? "✓" : "·"}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${gate.open ? "text-chalk" : "text-mist"}`}>{gate.label}</p>
              <p className="numeral mt-1 text-xs text-dim">{gate.detail}</p>
            </div>
            <span className="kicker shrink-0 pt-0.5">
              {gate.open ? "atende" : "não atende"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
