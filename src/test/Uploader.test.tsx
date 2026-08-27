import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Uploader from "../components/Uploader";

const defaults = {
  samples: [] as string[],
  sampleLabel: (slug: string) => slug,
  onSample: () => {},
  loadingSample: null,
};

const docx = () => new File(["conteudo"], "laudo.docx");

describe("Uploader", () => {
  it("hands an accepted file to the caller", async () => {
    const onSubmit = vi.fn();
    render(<Uploader {...defaults} onSubmit={onSubmit} />);

    await userEvent.upload(screen.getByLabelText("Laudo de manometria"), docx());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0].name).toBe("laudo.docx");
  });

  it("accepts the .rtf the Multiplex exports natively", async () => {
    const onSubmit = vi.fn();
    render(<Uploader {...defaults} onSubmit={onSubmit} />);

    await userEvent.upload(
      screen.getByLabelText("Laudo de manometria"),
      new File(["{\\rtf1}"], "laudo.rtf"),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("refuses another format before it costs a round trip", async () => {
    // The file picker filters by `accept`; a drop does not, so that is the path
    // the guard has to cover.
    const onSubmit = vi.fn();
    render(<Uploader {...defaults} onSubmit={onSubmit} />);

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: { files: [new File(["%PDF"], "laudo.pdf", { type: "application/pdf" })] },
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("não é um laudo");
  });

  it("takes a dropped laudo", () => {
    const onSubmit = vi.fn();
    render(<Uploader {...defaults} onSubmit={onSubmit} />);

    fireEvent.drop(screen.getByTestId("dropzone"), { dataTransfer: { files: [docx()] } });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("dropzone").dataset.dragging).toBe("false");
  });

  it("marks the zone while a file is over it and lets go afterwards", () => {
    render(<Uploader {...defaults} onSubmit={vi.fn()} />);
    const zone = screen.getByTestId("dropzone");

    // Drag events fire once per nested element; the zone must count them or it
    // clears the highlight as soon as the pointer crosses a child.
    fireEvent.dragEnter(zone);
    expect(zone.dataset.dragging).toBe("true");

    fireEvent.dragEnter(zone);
    fireEvent.dragLeave(zone);
    expect(zone.dataset.dragging).toBe("true");

    fireEvent.dragLeave(zone);
    expect(zone.dataset.dragging).toBe("false");
  });

  it("offers a sample per available diagnosis", async () => {
    const onSample = vi.fn();
    render(
      <Uploader
        {...defaults}
        samples={["normal_motility", "achalasia_type_ii"]}
        sampleLabel={(slug) => (slug === "normal_motility" ? "Normal" : "Acalásia II")}
        onSample={onSample}
        onSubmit={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Acalásia II" }));
    expect(onSample).toHaveBeenCalledWith("achalasia_type_ii");
  });

  it("locks the samples while one is being prepared", () => {
    render(
      <Uploader
        {...defaults}
        samples={["normal_motility"]}
        sampleLabel={() => "Normal"}
        loadingSample="normal_motility"
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "preparando…" })).toBeDisabled();
  });

  it("goes inert when the model is unavailable", () => {
    render(<Uploader {...defaults} onSubmit={vi.fn()} disabled />);
    expect(screen.getByTestId("dropzone").className).toContain("pointer-events-none");
  });
});
