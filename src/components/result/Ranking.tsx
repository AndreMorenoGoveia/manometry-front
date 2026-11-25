import { alpha, percent } from "../../lib/format";
import { useAfterMount } from "../../lib/useAfterMount";
import type { ClassScore } from "../../types";

interface RankingProps {
  ranking: ClassScore[];
}

export default function Ranking({ ranking }: RankingProps) {
  const mounted = useAfterMount();
  const top = ranking[0]?.probability ?? 1;
  return (
    <section className="rounded-3xl border hairline bg-slab/40 p-7 sm:p-9">
      <header className="mb-7 flex items-baseline justify-between gap-4">
        <h4 className="text-lg font-medium tracking-tight">Distribuição entre as sete classes</h4>
        <span className="kicker">softmax do exame</span>
      </header>
      <ol className="flex flex-col gap-3.5">
        {ranking.map((entry, index) => (
          <li key={entry.slug} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
            <div className="col-span-2 flex items-baseline justify-between gap-4">
              <span
                className={`truncate text-sm ${index === 0 ? "text-chalk" : "text-mist"}`}
                title={entry.name}
              >
                {entry.name}
              </span>
              <span
                className={`numeral shrink-0 text-sm tabular-nums ${index === 0 ? "text-chalk" : "text-dim"}`}
              >
                {percent(entry.probability, entry.probability < 0.01 ? 2 : 1)}
              </span>
            </div>
            <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-chalk/6">
              <div
                className="h-full rounded-full"
                style={{
                  width: mounted
                    ? `${Math.max(entry.probability / Math.max(top, 1e-6), 0.004) * 100}%`
                    : "0%",
                  background:
                    index === 0
                      ? entry.accent
                      : `linear-gradient(90deg, ${alpha(entry.accent, 0.55)}, ${alpha(entry.accent, 0.28)})`,
                  transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                  transitionDelay: `${index * 55}ms`,
                }}
              />
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs leading-relaxed text-dim">
        As barras são escaladas em relação à classe mais provável, e não ao total, para que
        hipóteses secundárias de baixa probabilidade continuem legíveis.
      </p>
    </section>
  );
}
