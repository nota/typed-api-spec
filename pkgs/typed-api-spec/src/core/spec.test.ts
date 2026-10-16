import { describe, it, expect } from "vitest";
import { Method } from "./spec.js";

describe("spec", () => {
  it("should work", () => {
    expect(Method).toEqual([
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "options",
      "head",
    ]);
  });
});
