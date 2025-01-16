import { describe, it, expect } from "vitest";
import * as v from "valibot";
import convert from "./convert";
import { toJsonSchema } from "@valibot/to-json-schema";

describe("OpenAPI", () => {
  const querySchema = v.object({
    name: v.optional(v.string()),
  });
  it("should ", async () => {
    const res = await convert(toJsonSchema(querySchema));
    expect(res).toEqual({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: [],
    });
  });
});
