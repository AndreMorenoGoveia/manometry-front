import { useEffect, useState } from "react";

import SchematicPlot from "./SchematicPlot";
import { alpha } from "../lib/format";
import { referenceImageUrl } from "../api";

interface ReferenceImageProps {
  slug: string;
  accent: string;
  name: string;
}

/**
 * A real swallow topography of the diagnosis, served by the API from the
 * held-out partition. If the corpus is not mounted the route answers 404 and
 * the schematic takes its place, so the page is never left with a broken image.
 */
export default function ReferenceImage({ slug, accent, name }: ReferenceImageProps) {
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    setState("loading");
  }, [slug]);

  return (
    <figure className="flex flex-col gap-4">
      <div
        className="relative overflow-hidden rounded-2xl border hairline p-3"
        style={{ background: `linear-gradient(160deg, ${alpha(accent, 0.12)}, rgba(9,11,18,0.85))` }}
      >
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: alpha(accent, 0.22) }}
        />
        {state !== "missing" ? (
          <img
            key={slug}
            src={referenceImageUrl(slug)}
            alt={`Topografia de pressão de um exame com ${name}`}
            loading="lazy"
            onLoad={() => setState("ready")}
            onError={() => setState("missing")}
            className={`relative mx-auto max-h-[420px] w-auto rounded-xl transition-opacity duration-700 ${
              state === "ready" ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <SchematicPlot slug={slug} accent={accent} className="relative mx-auto h-[320px] w-auto" />
        )}
        {state === "loading" && (
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-chalk/[0.03]" />
        )}
      </div>
      <figcaption className="text-xs leading-relaxed text-dim">
        {state === "missing"
          ? "Esquema da assinatura no traçado. O exemplo real aparece quando o corpus está montado no servidor."
          : "Deglutição real da partição de teste, com a moldura branca já removida: é exatamente o recorte que o modelo recebe."}
      </figcaption>
    </figure>
  );
}
