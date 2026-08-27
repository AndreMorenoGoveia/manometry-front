import type { AnalysisResponse, Disease, Health, ModelCard, SwallowResult } from "../types";

const CLASSES = [
  { slug: "absent_contractility", name: "Contratilidade ausente", short_name: "Contratilidade ausente", accent: "#94A3B8" },
  { slug: "achalasia_type_i", name: "Acalásia tipo I (clássica)", short_name: "Acalásia I", accent: "#A78BFA" },
  { slug: "achalasia_type_ii", name: "Acalásia tipo II (com pressurização panesofágica)", short_name: "Acalásia II", accent: "#E879F9" },
  { slug: "distal_esophageal_spasm", name: "Espasmo esofágico distal", short_name: "Espasmo distal", accent: "#FB923C" },
  { slug: "hypercontractile_esophagus", name: "Esôfago hipercontrátil (jackhammer)", short_name: "Hipercontrátil", accent: "#F87171" },
  { slug: "hypotensive_egj", name: "Junção esofagogástrica hipotensiva", short_name: "JEG hipotensiva", accent: "#38BDF8" },
  { slug: "ineffective_esophageal_motility", name: "Motilidade esofágica ineficaz", short_name: "MEI", accent: "#FBBF24" },
  { slug: "normal_motility", name: "Motilidade esofágica normal", short_name: "Normal", accent: "#34D399" },
];

const PROBABILITIES: Record<string, number> = {
  achalasia_type_ii: 0.82,
  achalasia_type_i: 0.09,
  distal_esophageal_spasm: 0.035,
  absent_contractility: 0.02,
  hypercontractile_esophagus: 0.012,
  hypotensive_egj: 0.009,
  ineffective_esophageal_motility: 0.008,
  normal_motility: 0.006,
};

export const ranking = CLASSES.map((entry) => ({
  ...entry,
  family: "Obstrução da saída da junção esofagogástrica",
  probability: PROBABILITIES[entry.slug] ?? 0,
})).sort((a, b) => b.probability - a.probability);

const metrics = (overrides: Partial<Record<string, number>> = {}) =>
  [
    { key: "dci", label: "DCI", long: "Integral contrátil distal", unit: "mmHg·s·cm", value: 62 },
    { key: "irp4", label: "IRP 4s", long: "Pressão de relaxamento integrada", unit: "mmHg", value: 21.4 },
    { key: "distal_latency", label: "Latência distal", long: "Latência distal (DL)", unit: "s", value: 5.2 },
    { key: "front_arrival", label: "Chegada da frente", long: "Chegada da frente contrátil", unit: "s", value: 2.1 },
    { key: "largest_break_cm", label: "Maior quebra", long: "Maior quebra no contorno de 20 mmHg", unit: "cm", value: 8 },
    { key: "egj_basal", label: "JEG basal", long: "Pressão basal da junção esofagogástrica", unit: "mmHg", value: 34.5 },
    { key: "peak_distal_pressure", label: "Pico distal", long: "Pico de pressão no esôfago distal", unit: "mmHg", value: 58.2 },
    { key: "pressurization_fraction", label: "Corpo pressurizado", long: "Maior fração do corpo acima de 30 mmHg", unit: "fração", value: 0.96 },
    { key: "pan_time_fraction", label: "Tempo panesofágico", long: "Fração do tempo com o corpo pressurizado", unit: "fração", value: 0.34 },
    { key: "body_length_cm", label: "Extensão do corpo", long: "Extensão do corpo esofágico avaliada", unit: "cm", value: 13 },
  ].map((metric) => ({ ...metric, value: overrides[metric.key] ?? metric.value }));

export const swallows: SwallowResult[] = [1, 2, 3].map((index) => ({
  index,
  used: true,
  pattern: index === 2 ? "failed" : "panesophageal",
  pattern_label: index === 2 ? "Falha" : "Pressurização panesofágica",
  pattern_description:
    index === 2
      ? "Sem contração mensurável, com DCI abaixo de 100 mmHg·s·cm."
      : "Coluna pressurizada de forma uniforme entre o esfíncter superior e a JEG.",
  colour_confidence: 0.93,
  metrics: metrics({ dci: index === 2 ? 12 : 62 }),
  top_class: { ...ranking[0]!, probability: 0.71 },
  thumbnail: "data:image/png;base64,iVBORw0KGgo=",
}));

export const modelCard: ModelCard = {
  encoder: "convnext_base_in22k",
  fusion: "chicago_set",
  seed: 42,
  classes: CLASSES.map((entry) => entry.slug),
  max_swallows: 10,
  device: "cuda",
  selected_epoch: 10,
  selected_weights: "ema",
  test_metrics: {
    accuracy: 0.747,
    balanced_accuracy: 0.7373,
    macro_f1: 0.7425,
    weighted_f1: 0.7463,
    kappa: 0.6899,
    auroc_ovr: 0.9402,
  },
  val_metrics: { macro_f1: 0.7489 },
  exam_counts: { train: 1008, val: 337, test: 336 },
  per_class: [
    { slug: "achalasia_type_ii", support: 34, precision: 0.84, recall: 0.88, f1: 0.86 },
  ],
  calibration: { pressure_offset: -10, pressure_scale: 100 },
};

export const analysis: AnalysisResponse = {
  filename: "laudo_demo.docx",
  diagnosis: {
    ...ranking[0]!,
    tagline: "Obstrução da JEG com compressão panesofágica do bolo",
    summary: "A JEG não relaxa e o corpo esofágico comprime o bolo em toda a sua extensão.",
  },
  ranking,
  swallows,
  study: {
    swallows: 3,
    median_irp4: 21.4,
    median_dci: 62,
    max_dci: 96,
    median_distal_latency: 5.2,
    min_distal_latency: 4.9,
    max_break_cm: 8,
    median_egj_basal: 34.5,
    failed_fraction: 1,
    ineffective_fraction: 1,
    premature_fraction: 0,
    hypercontractile_fraction: 0,
    panesophageal_fraction: 0.67,
    gates: [
      { key: "irp_elevated", label: "IRP mediana elevada", open: true, detail: "21.4 mmHg (corte 15 mmHg)" },
      { key: "absent_contractility_gate", label: "100% de deglutições falhas", open: true, detail: "100% com DCI < 100" },
      { key: "premature_gate", label: "≥ 20% prematuras", open: false, detail: "0% com DL < 4.5 s (menor DL 4.9 s)" },
    ],
  },
  panels: {
    total: 5,
    accepted: 3,
    off_spec: 0,
    logo: 1,
    placeholder: 1,
    not_localizable: 0,
    unreadable: 0,
  },
  warnings: ["1 painel “sem dados” do software de aquisição foi descartado."],
  elapsed_ms: 1240,
  model_card: modelCard,
};

export const diseases: Disease[] = CLASSES.map((entry, index) => ({
  slug: entry.slug,
  name: entry.name,
  short_name: entry.short_name,
  english: `English name ${index}`,
  family: "Distúrbios da peristalse",
  accent: entry.accent,
  tagline: `Assinatura de ${entry.short_name}`,
  summary: `Resumo clínico de ${entry.name}.`,
  criteria: ["Critério A", "Critério B", "Critério C"],
  topography: `No traçado de ${entry.short_name}.`,
  symptoms: ["Disfagia", "Dor torácica"],
  management: `Conduta para ${entry.short_name}.`,
  differential: ["Diferencial A", "Diferencial B"],
  metric_signature: { irp4: "≤ 15 mmHg", dci: "450 a 8.000" },
  prevalence: 100 + index * 40,
  caveat: index === 5 ? "Ressalva importante." : "",
  references: ["Chicago Classification v4.0"],
}));

export const health: Health = {
  status: "ok",
  version: "1.0.0",
  model_available: true,
  model_loaded: true,
  device: "cuda",
  checkpoint: "/artifacts/model.pt",
};
