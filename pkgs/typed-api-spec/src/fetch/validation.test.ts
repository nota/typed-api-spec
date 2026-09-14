import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { withValidation, SpecValidatorError } from "./validation";
import { ApiEndpointsSchema } from "../core/schema";

const origin = "https://example.com";

const newMockFetch = (body: unknown, init: ResponseInit = {}) =>
  vi.fn(
    async () => new Response(JSON.stringify(body), init),
  ) as unknown as typeof fetch;

describe("withValidation", () => {
  const pathMap = {
    "/:paramsName": {
      get: {
        params: z.object({ paramsName: z.string() }),
        query: z.object({ queryName: z.string() }),
        responses: {
          200: { body: z.object({ bodyNameRes: z.string() }) },
        },
      },
    },
  } satisfies ApiEndpointsSchema;
  const path = `${origin}/p`;

  describe("policy: throw (default)", () => {
    it("rejects when the request is invalid", async () => {
      // missing required "queryName" query parameter
      const ft = newMockFetch({ bodyNameRes: "b" });
      const fetchV = withValidation(ft, pathMap);
      await expect(fetchV(path)).rejects.toThrow(SpecValidatorError);
      expect(ft).not.toHaveBeenCalled();
    });

    it("rejects when the response is invalid", async () => {
      const ft = newMockFetch({ invalid: "value" });
      const fetchV = withValidation(ft, pathMap);
      await expect(fetchV(`${path}?queryName=q`)).rejects.toThrow(
        SpecValidatorError,
      );
    });

    it("resolves when both request and response are valid", async () => {
      const ft = newMockFetch({ bodyNameRes: "b" });
      const fetchV = withValidation(ft, pathMap);
      const res = await fetchV(`${path}?queryName=q`);
      expect(await res?.json()).toEqual({ bodyNameRes: "b" });
    });
  });

  describe("policy: log", () => {
    it("does not reject when the request is invalid, and logs instead", async () => {
      // missing required "queryName" query parameter
      const ft = newMockFetch({ bodyNameRes: "b" });
      const fetchV = withValidation(ft, pathMap, { policy: "log" });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(fetchV(path)).resolves.toBeInstanceOf(Response);
      expect(errorSpy).toHaveBeenCalledWith(expect.any(SpecValidatorError));
      expect(ft).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("does not reject when the response is invalid, and logs instead", async () => {
      const ft = newMockFetch({ invalid: "value" });
      const fetchV = withValidation(ft, pathMap, { policy: "log" });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(fetchV(`${path}?queryName=q`)).resolves.toBeInstanceOf(
        Response,
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.any(SpecValidatorError));
      errorSpy.mockRestore();
    });
  });
});
