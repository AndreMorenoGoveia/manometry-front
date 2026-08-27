import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { analysis, diseases, health, modelCard } from "./fixtures";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

interface RouteOverrides {
  health?: Response | (() => Response);
  analyze?: () => Response;
  samples?: string[];
}

function stubApi(overrides: RouteOverrides = {}) {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    if (url.startsWith("/api/health")) {
      const override = overrides.health;
      if (typeof override === "function") return override();
      return override ?? json(health);
    }
    if (url.startsWith("/api/diseases")) return json({ diseases });
    if (url.startsWith("/api/model")) return json(modelCard);
    if (url.startsWith("/api/samples")) return json({ available: overrides.samples ?? [] });
    if (url.startsWith("/api/sample-report")) {
      return new Response(new Blob(["docx"]), { status: 200 });
    }
    if (url.startsWith("/api/analyze")) {
      return overrides.analyze ? overrides.analyze() : json(analysis);
    }
    return json({}, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const laudo = () => new File(["conteudo"], "laudo.docx");

describe("App", () => {
  it("renders the landing page and the atlas once the API answers", async () => {
    stubApi();
    render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Classificação de Chicago v4.0",
    );
    expect(await screen.findByText(/modelo pronto/)).toBeInTheDocument();
    expect(await screen.findByRole("navigation", { name: "Diagnósticos" })).toBeInTheDocument();
    // The results table is the only place model numbers are quoted.
    const results = document.getElementById("resultados")!;
    await waitFor(() => expect(within(results).getByRole("table")).toBeInTheDocument());
    expect(within(results).getByText("88,0%")).toBeInTheDocument();   // recall
  });

  it("walks an upload from the dropzone to the diagnosis", async () => {
    stubApi();
    render(<App />);

    await userEvent.upload(screen.getByLabelText("Laudo de manometria"), laudo());

    const result = await screen.findByTestId("result-view");
    expect(
      within(result).getByRole("heading", { name: /Acalásia tipo II/, level: 3 }),
    ).toBeInTheDocument();
    expect(within(result).getByText("laudo_demo.docx")).toBeInTheDocument();
  });

  it("shows the pipeline while the server is still thinking", async () => {
    let release: (value: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.startsWith("/api/analyze")) return pending;
        if (url.startsWith("/api/diseases")) return json({ diseases });
        if (url.startsWith("/api/health")) return json(health);
        if (url.startsWith("/api/model")) return json(modelCard);
        return json({ available: [] });
      }),
    );

    render(<App />);
    await userEvent.upload(screen.getByLabelText("Laudo de manometria"), laudo());

    expect(await screen.findByTestId("pipeline-progress")).toHaveTextContent("laudo.docx");
    release(json(analysis));
    expect(await screen.findByTestId("result-view")).toBeInTheDocument();
  });

  it("reports the API's refusal in the reader's own words", async () => {
    stubApi({ analyze: () => json({ detail: "Nenhuma deglutição válida foi encontrada." }, 422) });
    render(<App />);

    await userEvent.upload(screen.getByLabelText("Laudo de manometria"), laudo());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Nenhuma deglutição válida foi encontrada.");
    // The dropzone stays available for another try.
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
  });

  it("explains a server that is up without a checkpoint, and blocks the upload", async () => {
    stubApi({ health: json({ ...health, model_available: false, model_loaded: false }) });
    render(<App />);

    // Once in the header pill, once as the explanation above the dropzone.
    await waitFor(() =>
      expect(screen.getAllByText(/modelo indisponível/i).length).toBeGreaterThanOrEqual(2),
    );
    await waitFor(() =>
      expect(screen.getByTestId("dropzone").className).toContain("pointer-events-none"),
    );
  });

  it("survives an API that is not there at all", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("ECONNREFUSED"))));
    render(<App />);

    // The bar renders a wide and a narrow label; CSS picks one.
    expect(await screen.findAllByText("conectando")).toHaveLength(2);
    // Without the disease list the atlas is skipped, but the page still stands.
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
  });

  it("analyses a generated sample laudo", async () => {
    const { calls } = stubApi({ samples: ["achalasia_type_ii"] });
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: "Acalásia II" }));

    expect(await screen.findByTestId("result-view")).toBeInTheDocument();
    expect(calls.some((url) => url.includes("sample-report?diagnosis=achalasia_type_ii"))).toBe(true);
  });

  it("selects the diagnosed class in the atlas after an analysis", async () => {
    stubApi();
    render(<App />);
    await userEvent.upload(screen.getByLabelText("Laudo de manometria"), laudo());
    await screen.findByTestId("result-view");

    const index = screen.getByRole("navigation", { name: "Diagnósticos" });
    const entry = within(index).getByRole("button", { name: /Acalásia tipo II/ });
    expect(entry).toHaveAttribute("aria-current", "true");
    expect(within(entry).getByText("deste exame")).toBeInTheDocument();
  });

  it("returns to the dropzone when asked for another laudo", async () => {
    stubApi();
    render(<App />);
    await userEvent.upload(screen.getByLabelText("Laudo de manometria"), laudo());
    await screen.findByTestId("result-view");

    await userEvent.click(screen.getByRole("button", { name: /Analisar outro laudo/ }));

    expect(screen.queryByTestId("result-view")).not.toBeInTheDocument();
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
  });
});
