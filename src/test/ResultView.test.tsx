import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ResultView from "../components/result/ResultView";
import { analysis } from "./fixtures";

const renderResult = (overrides: Partial<typeof analysis> = {}) => {
  const onOpenAtlas = vi.fn();
  const onReset = vi.fn();
  render(
    <ResultView
      result={{ ...analysis, ...overrides }}
      onReset={onReset}
      onOpenAtlas={onOpenAtlas}
    />,
  );
  return { onOpenAtlas, onReset };
};

describe("ResultView", () => {
  it("leads with the diagnosis and its confidence", () => {
    renderResult();
    expect(
      screen.getByRole("heading", { name: /Acalásia tipo II/ }),
    ).toBeInTheDocument();
    // Once in the gauge, once in the ranking.
    expect(screen.getAllByText("82,0%")).toHaveLength(2);
    expect(screen.getByText(/2ª hipótese: Acalásia I/)).toBeInTheDocument();
  });

  it("lists every class in descending probability", () => {
    renderResult();
    const section = screen.getByRole("heading", { name: /Distribuição entre as sete classes/ })
      .closest("section")!;
    const rows = within(section).getAllByRole("listitem");
    expect(rows).toHaveLength(analysis.ranking.length);
    expect(rows[0]).toHaveTextContent("Acalásia tipo II");
  });

  it("shows the Chicago gates with the number behind each one", () => {
    renderResult();
    expect(screen.getByText("21.4 mmHg (corte 15 mmHg)")).toBeInTheDocument();
    const irp = screen.getByText("IRP mediana elevada").closest("li")!;
    expect(within(irp).getByText("atende")).toBeInTheDocument();
    const premature = screen.getByText("≥ 20% prematuras").closest("li")!;
    expect(within(premature).getByText("não atende")).toBeInTheDocument();
  });

  it("surfaces the reader warnings", () => {
    renderResult();
    expect(screen.getByText(/painel “sem dados”/)).toBeInTheDocument();
  });

  it("omits the warning block when there is nothing to warn about", () => {
    renderResult({ warnings: [] });
    expect(screen.queryByText(/observações sobre a leitura/)).not.toBeInTheDocument();
  });

  it("carries the reader to the atlas entry of the diagnosis", async () => {
    const { onOpenAtlas } = renderResult();
    await userEvent.click(screen.getByRole("button", { name: /Ler sobre a doença/ }));
    expect(onOpenAtlas).toHaveBeenCalledWith("achalasia_type_ii");
  });

  it("can be reset for another laudo", async () => {
    const { onReset } = renderResult();
    await userEvent.click(screen.getByRole("button", { name: /Analisar outro laudo/ }));
    expect(onReset).toHaveBeenCalled();
  });

  it("keeps the medical disclaimer on screen", () => {
    renderResult();
    expect(screen.getByText(/não substituem a leitura do exame/)).toBeInTheDocument();
  });
});

describe("SwallowStrip inside the result", () => {
  it("opens on the first swallow and switches on click", async () => {
    renderResult();
    const strip = screen.getByTestId("swallow-strip");
    const buttons = within(strip).getAllByRole("button");
    expect(buttons).toHaveLength(analysis.swallows.length);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");

    // The second swallow of the fixture is the failed one.
    await userEvent.click(buttons[1]!);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Falha")).toBeInTheDocument();
    expect(screen.getByText(/Sem contração mensurável/)).toBeInTheDocument();
  });

  it("shows every Chicago metric of the selected swallow", () => {
    renderResult();
    for (const metric of analysis.swallows[0]!.metrics) {
      expect(screen.getAllByText(metric.label).length).toBeGreaterThan(0);
    }
  });
});
