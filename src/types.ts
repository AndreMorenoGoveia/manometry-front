/**
 * Mirrors of the API's response models (`app/schemas.py`, `app/diseases.py`).
 * Kept hand-written rather than generated so a drift shows up as a type error
 * in review instead of silently at runtime.
 */

export interface ClassScore {
  slug: string;
  name: string;
  short_name: string;
  accent: string;
  family: string;
  probability: number;
}

export interface Diagnosis extends ClassScore {
  tagline: string;
  summary: string;
}

export interface SwallowMetric {
  key: string;
  label: string;
  long: string;
  unit: string;
  value: number;
}

export interface SwallowResult {
  index: number;
  used: boolean;
  pattern: string;
  pattern_label: string;
  pattern_description: string;
  colour_confidence: number;
  metrics: SwallowMetric[];
  top_class: ClassScore | null;
  thumbnail: string;
}

export interface StudyGate {
  key: string;
  label: string;
  open: boolean;
  detail: string;
}

export interface StudySummary {
  swallows: number;
  median_irp4: number;
  median_dci: number;
  max_dci: number;
  median_distal_latency: number;
  min_distal_latency: number;
  max_break_cm: number;
  median_egj_basal: number;
  failed_fraction: number;
  ineffective_fraction: number;
  premature_fraction: number;
  hypercontractile_fraction: number;
  panesophageal_fraction: number;
  gates: StudyGate[];
}

export interface PanelAudit {
  total: number;
  accepted: number;
  off_spec: number;
  logo: number;
  placeholder: number;
  not_localizable: number;
  unreadable: number;
}

export interface ModelMetrics {
  accuracy?: number;
  balanced_accuracy?: number;
  macro_f1?: number;
  weighted_f1?: number;
  kappa?: number;
  auroc_ovr?: number;
}

export interface ModelCard {
  encoder: string | null;
  fusion: string | null;
  seed: number | null;
  classes: string[];
  max_swallows: number;
  device: string;
  selected_epoch: number | null;
  selected_weights: string | null;
  test_metrics: ModelMetrics | null;
  val_metrics: ModelMetrics | null;
  exam_counts: Record<string, number> | null;
  per_class: PerClassMetric[] | null;
  calibration: Record<string, unknown> | null;
}

export interface PerClassMetric {
  slug: string;
  support: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface AnalysisResponse {
  filename: string;
  diagnosis: Diagnosis;
  ranking: ClassScore[];
  swallows: SwallowResult[];
  study: StudySummary;
  panels: PanelAudit;
  warnings: string[];
  elapsed_ms: number;
  model_card: ModelCard;
}

export interface Disease {
  slug: string;
  name: string;
  short_name: string;
  english: string;
  family: string;
  accent: string;
  tagline: string;
  summary: string;
  criteria: string[];
  topography: string;
  symptoms: string[];
  management: string;
  differential: string[];
  metric_signature: Record<string, string>;
  prevalence: number;
  caveat: string;
  references: string[];
}

export interface Health {
  status: string;
  version: string;
  model_available: boolean;
  model_loaded: boolean;
  device: string;
  checkpoint: string;
}
