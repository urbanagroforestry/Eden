import { describe, it, expect } from "vitest";
import { areaFromBoundary, isValidBoundary } from "@/lib/geo";

describe("geo utilities", () => {
  it("computes area and validates polygon", () => {
    const boundary: [number, number][] = [
      [-97.74, 30.26],
      [-97.73, 30.26],
      [-97.73, 30.27],
      [-97.74, 30.27]
    ];
    expect(areaFromBoundary(boundary)).toBeGreaterThan(0);
    expect(isValidBoundary(boundary).valid).toBe(true);
  });
});
