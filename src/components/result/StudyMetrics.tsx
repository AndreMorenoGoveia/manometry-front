import { number, percent } from "../../lib/format";
import type { StudySummary } from "../../types";

interface StudyMetricsProps {
  study: StudySummary;
}

function Cell({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t hairline pt-4">
      <span className="kicker">{label}</span>
      <span className="numeral text-xl font-light leading-none">
        {value}
        {unit && <span className="ml-1 text-sm text-dim">{unit}</span>}
      </span>
      {hint && <span className="text-xs leading-snug text-dim">{hint}</span>}
    </div>
  );
}

export default function StudyMetrics({ study }: StudyMetricsProps) {
  return (
    <section className="rounded-3xl border hairline bg-slab/40 p-7 sm:p-9">
      <header className="mb-7 flex items-baseline justify-between gap-4">
        <h4 className="text-lg font-medium tracking-tight">Resumo do estudo</h4>
        <span className="kicker">{study.swallows} deglutições</span>
      </header>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        <Cell label="IRP mediana" value={number(study.median_irp4, 1)} unit="mmHg" hint="corte 15" />
        <Cell label="DCI mediana" value={number(study.median_dci, 0)} unit="mmHg·s·cm" hint="normal 450 a 8.000" />
        <Cell label="DCI máxima" value={number(study.max_dci, 0)} unit="mmHg·s·cm" />
        <Cell label="JEG basal mediana" value={number(study.median_egj_basal, 1)} unit="mmHg" />
        <Cell label="Latência distal mediana" value={number(study.median_distal_latency, 1)} unit="s" hint="prematura < 4,5" />
        <Cell label="Menor latência distal" value={number(study.min_distal_latency, 1)} unit="s" />
        <Cell label="Maior quebra" value={number(study.max_break_cm, 1)} unit="cm" hint="fragmentada > 5" />
        <Cell label="Deglutições falhas" value={percent(study.failed_fraction)} hint="DCI < 100" />
        <Cell label="Deglutições ineficazes" value={percent(study.ineffective_fraction)} hint="DCI < 450" />
        <Cell label="Prematuras" value={percent(study.premature_fraction)} hint="DL < 4,5 s e DCI > 450" />
        <Cell label="Hipercontráteis" value={percent(study.hypercontractile_fraction)} hint="DCI > 8.000" />
        <Cell label="Pressurização panesofágica" value={percent(study.panesophageal_fraction)} />
      </div>
    </section>
  );
}
