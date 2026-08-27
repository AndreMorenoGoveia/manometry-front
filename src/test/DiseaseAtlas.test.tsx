import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DiseaseAtlas from "../components/DiseaseAtlas";
import { diseases, modelCard } from "./fixtures";

function renderAtlas(selected: string | null = diseases[0]!.slug) {
  const onSelect = vi.fn();
  const view = render(
    <DiseaseAtlas
      diseases={diseases}
      selected={selected}
      onSelect={onSelect}
      perClass={modelCard.per_class}
      highlight={null}
    />,
  );
  return { onSelect, view };
}

describe("DiseaseAtlas", () => {
  it("indexes every class the model can return", () => {
    renderAtlas();
    const index = screen.getByRole("navigation", { name: "Diagnósticos" });
    expect(within(index).getAllByRole("button")).toHaveLength(diseases.length);
  });

  it("shows the selected entry in full", () => {
    renderAtlas("achalasia_type_ii");
    expect(
      screen.getByRole("heading", { name: /Acalásia tipo II/, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Critério A")).toBeInTheDocument();
    expect(screen.getByText(/Conduta para Acalásia II/)).toBeInTheDocument();
    expect(screen.getByText("Chicago Classification v4.0")).toBeInTheDocument();
  });

  it("asks the parent to change the selection", async () => {
    const { onSelect } = renderAtlas();
    const index = screen.getByRole("navigation", { name: "Diagnósticos" });
    await userEvent.click(within(index).getByRole("button", { name: /Espasmo esofágico distal/ }));
    expect(onSelect).toHaveBeenCalledWith("distal_esophageal_spasm");
  });

  it("falls back to the first entry when nothing is selected yet", () => {
    renderAtlas(null);
    expect(
      screen.getByRole("heading", { name: /Contratilidade ausente/, level: 3 }),
    ).toBeInTheDocument();
  });

  it("shows the held-out performance of the class when the model card has it", () => {
    renderAtlas("achalasia_type_ii");
    expect(screen.getByText("88,0%")).toBeInTheDocument();  // recall
    expect(screen.getByText("0.860")).toBeInTheDocument();  // f1
  });

  it("hides the performance block for a class the card does not cover", () => {
    renderAtlas("normal_motility");
    expect(screen.queryByText("sensibilidade no teste")).not.toBeInTheDocument();
  });

  it("shows a caveat only where one exists", () => {
    renderAtlas("hypotensive_egj");
    expect(screen.getByText("Ressalva importante.")).toBeInTheDocument();
  });

  it("marks the entry that this exam was classified as", () => {
    render(
      <DiseaseAtlas
        diseases={diseases}
        selected="normal_motility"
        onSelect={vi.fn()}
        perClass={null}
        highlight="achalasia_type_i"
      />,
    );
    const entry = screen.getByRole("button", { name: /Acalásia tipo I \(clássica\)/ });
    expect(within(entry).getByText("deste exame")).toBeInTheDocument();
  });

  it("renders a schematic for every diagnosis", () => {
    for (const disease of diseases) {
      const { unmount } = render(
        <DiseaseAtlas
          diseases={diseases}
          selected={disease.slug}
          onSelect={vi.fn()}
          perClass={null}
          highlight={null}
        />,
      );
      expect(
        screen.getAllByRole("img", { name: new RegExp(`Assinatura esquemática de ${disease.slug}`) })
          .length,
      ).toBeGreaterThan(0);
      unmount();
    }
  });
});
