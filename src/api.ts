import type { AnalysisResponse, Disease, Health, ModelCard } from "./types";

/**
 * In development the Vite server proxies `/api` to the backend, so the browser
 * stays on one origin and uploads never negotiate CORS. A deployed build can
 * point elsewhere with `VITE_API_BASE`.
 */
const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
  } catch {
    /* the body was not JSON; fall through to the status text */
  }
  return response.statusText || `Erro ${response.status}`;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { signal });
  if (!response.ok) throw new ApiError(await readError(response), response.status);
  return (await response.json()) as T;
}

export const getHealth = (signal?: AbortSignal) => getJson<Health>("/api/health", signal);

export const getModelCard = (signal?: AbortSignal) => getJson<ModelCard>("/api/model", signal);

export const getDiseases = async (signal?: AbortSignal): Promise<Disease[]> =>
  (await getJson<{ diseases: Disease[] }>("/api/diseases", signal)).diseases;

export const referenceImageUrl = (slug: string) => `${BASE}/api/diseases/${slug}/reference.png`;

/** Diagnoses the server can build a demo laudo for; empty when the corpus is absent. */
export async function getSampleDiagnoses(signal?: AbortSignal): Promise<string[]> {
  try {
    const payload = await getJson<{ available?: string[] }>("/api/samples", signal);
    return payload.available ?? [];
  } catch {
    return [];
  }
}

/** A demo laudo generated from a real held-out examination of `slug`. */
export async function getSampleReport(slug: string, signal?: AbortSignal): Promise<File> {
  const response = await fetch(
    `${BASE}/api/sample-report?diagnosis=${encodeURIComponent(slug)}`,
    { signal },
  );
  if (!response.ok) throw new ApiError(await readError(response), response.status);
  const blob = await response.blob();
  return new File([blob], `laudo_exemplo_${slug}.docx`, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export async function analyze(file: File, signal?: AbortSignal): Promise<AnalysisResponse> {
  const body = new FormData();
  body.append("file", file, file.name);
  const response = await fetch(`${BASE}/api/analyze`, { method: "POST", body, signal });
  if (!response.ok) throw new ApiError(await readError(response), response.status);
  return (await response.json()) as AnalysisResponse;
}
