import { describe, expect, it } from "vitest";

import { alpha, bytes, count, duration, formatMetric, formatUnit, number, percent } from "../lib/format";

describe("formatMetric", () => {
  it("gives each Chicago metric the precision its range deserves", () => {
    // DCI spans four orders of magnitude: decimals are noise.
    expect(formatMetric("dci", 1899.6)).toBe("1.900");
    expect(formatMetric("irp4", 21.44)).toBe("21,4");
    expect(formatMetric("pan_time_fraction", 0.3456)).toBe("0,35");
  });

  it("falls back to one decimal for an unknown key", () => {
    expect(formatMetric("unheard_of", 3.14159)).toBe("3,1");
  });

  it("shows a dash instead of NaN", () => {
    expect(formatMetric("dci", Number.NaN)).toBe("n/d");
    expect(formatMetric("irp4", Number.POSITIVE_INFINITY)).toBe("n/d");
  });
});

describe("formatUnit", () => {
  it("drops the pseudo-unit of a ratio", () => {
    expect(formatUnit("fração")).toBe("");
    expect(formatUnit("mmHg")).toBe("mmHg");
  });
});

describe("percent", () => {
  it("renders a probability in pt-BR", () => {
    expect(percent(0.8231, 1)).toBe("82,3%");
    expect(percent(1)).toBe("100%");
    expect(percent(0.004, 2)).toBe("0,40%");
  });
});

describe("number", () => {
  it("keeps trailing zeros so columns line up", () => {
    expect(number(0.7, 3)).toBe("0,700");
  });
});

describe("bytes", () => {
  it("switches unit at each threshold", () => {
    expect(bytes(512)).toBe("512 B");
    expect(bytes(2048)).toBe("2 kB");
    expect(bytes(5 * 1024 * 1024)).toBe("5,0 MB");
  });
});

describe("duration", () => {
  it("stays in milliseconds below a second", () => {
    expect(duration(320)).toBe("320 ms");
    expect(duration(1240)).toBe("1,2 s");
  });
});

describe("alpha", () => {
  it("turns a hex accent into rgba", () => {
    expect(alpha("#60e6c8", 0.2)).toBe("rgba(96, 230, 200, 0.2)");
  });

  it("expands the three-digit form", () => {
    expect(alpha("#0f0", 1)).toBe("rgba(0, 255, 0, 1)");
  });

  it("falls back rather than emitting NaN into a style attribute", () => {
    expect(alpha("not-a-colour", 0.5)).toBe("rgba(96, 230, 200, 0.5)");
  });
});

describe("count", () => {
  it("groups thousands the pt-BR way", () => {
    expect(count(1681)).toBe("1.681");
    expect(count(336)).toBe("336");
  });
});
