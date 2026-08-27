import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  analyze,
  getDiseases,
  getHealth,
  getSampleDiagnoses,
  getSampleReport,
  referenceImageUrl,
} from "../api";
import { diseases, health } from "./fixtures";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getHealth", () => {
  it("returns the parsed payload", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(health)));
    await expect(getHealth()).resolves.toEqual(health);
  });
});

describe("getDiseases", () => {
  it("unwraps the envelope", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ diseases })));
    await expect(getDiseases()).resolves.toHaveLength(diseases.length);
  });
});

describe("analyze", () => {
  it("posts the file as multipart form data", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ filename: "l.docx" }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "laudo.docx");

    await analyze(file);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/analyze");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const sent = (init.body as FormData).get("file") as File;
    expect(sent.name).toBe("laudo.docx");
  });

  it("surfaces the API's own message and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ detail: "Nenhuma deglutição válida" }, 422)),
    );
    await expect(analyze(new File(["x"], "l.docx"))).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "Nenhuma deglutição válida",
    });
  });

  it("reads the first message of a validation error list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ detail: [{ msg: "campo ausente" }] }, 422)),
    );
    await expect(analyze(new File(["x"], "l.docx"))).rejects.toThrow("campo ausente");
  });

  it("falls back to the status text when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>502</html>", { status: 502, statusText: "Bad Gateway" })),
    );
    await expect(analyze(new File(["x"], "l.docx"))).rejects.toThrow("Bad Gateway");
  });

  it("throws ApiError, not a bare Error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "nope" }, 503)));
    await expect(analyze(new File(["x"], "l.docx"))).rejects.toBeInstanceOf(ApiError);
  });
});

describe("getSampleDiagnoses", () => {
  it("returns the list the server offers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ available: ["normal_motility"] })));
    await expect(getSampleDiagnoses()).resolves.toEqual(["normal_motility"]);
  });

  it("degrades to no samples rather than breaking the page", async () => {
    // A server without the corpus mounted answers 404 here; the dropzone is
    // still perfectly usable, so this must not surface as an error.
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "sem corpus" }, 404)));
    await expect(getSampleDiagnoses()).resolves.toEqual([]);
  });
});

describe("getSampleReport", () => {
  it("wraps the download as a named .docx File", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Blob(["docx"]), { status: 200 })),
    );
    const file = await getSampleReport("achalasia_type_ii");
    expect(file.name).toBe("laudo_exemplo_achalasia_type_ii.docx");
    expect(file.type).toContain("wordprocessingml");
  });

  it("escapes the slug into the query", async () => {
    const seen: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        seen.push(String(input));
        return new Response(new Blob([""]), { status: 200 });
      }),
    );
    await getSampleReport("a b/c");
    expect(seen[0]).toContain("diagnosis=a%20b%2Fc");
  });

  it("raises with the server's status when the corpus is missing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "sem corpus" }, 404)));
    await expect(getSampleReport("normal_motility")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("referenceImageUrl", () => {
  it("points at the disease's own reference route", () => {
    expect(referenceImageUrl("achalasia_type_i")).toBe(
      "/api/diseases/achalasia_type_i/reference.png",
    );
  });
});
