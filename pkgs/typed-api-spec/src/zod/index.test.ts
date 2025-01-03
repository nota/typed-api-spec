import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";
import { newZodValidator, ZodApiEndpoints } from "./index";
import { newValidatorPathNotFoundError } from "../core/validator/validate";
import { AnySpecValidator } from "../core/validator/request";
import { AnyResponseSpecValidator } from "../core/validator/response";
import { newMethodInvalidError } from "../core";

describe("newZodValidator", () => {
  const pathMap = {
    "/": {
      get: {
        query: z.object({ queryName: z.string() }),
        body: z.object({ bodyName: z.string() }),
        headers: z.object({ headersName: z.string() }),
        params: z.object({ paramsName: z.string() }),
        responses: {
          200: {
            body: z.object({ bodyNameRes: z.string() }),
            headers: z.object({ headersNameRes: z.string() }),
          },
        },
      },
    },
  } satisfies ZodApiEndpoints;

  const validReqInput = {
    path: "/" as const,
    method: "get" as const,
    params: { paramsName: "paramsName" },
    query: { queryName: "queryName" },
    body: { bodyName: "bodyName" },
    headers: { headersName: "headersName" },
  };

  const validResInput = {
    path: "/" as const,
    method: "get" as const,
    statusCode: 200 as const,
    body: { bodyNameRes: "bodyNameRes" },
    headers: { headersNameRes: "headersNameRes" },
  };

  it("ok", () => {
    const { req, res } = newZodValidator(pathMap);
    const { data: reqV, error } = req(validReqInput);
    expect(error).toBeUndefined();
    if (error !== undefined) {
      return;
    }
    expect(reqV["query"]()).toEqual({ data: { queryName: "queryName" } });
    expect(reqV["params"]()).toEqual({ data: { paramsName: "paramsName" } });
    expect(reqV["body"]()).toEqual({ data: { bodyName: "bodyName" } });
    expect(reqV["headers"]()).toEqual({ data: { headersName: "headersName" } });

    const { data: resV, error: resE } = res(validResInput);
    expect(resE).toBeUndefined();
    if (resE !== undefined) {
      return;
    }

    expect(resV["body"]()).toEqual({ data: { bodyNameRes: "bodyNameRes" } });
    expect(resV["headers"]()).toEqual({
      data: { headersNameRes: "headersNameRes" },
    });
  });

  const checkZodError = (error: ZodError, path: string) => {
    expect(error).toBeInstanceOf(ZodError);
    expect(error.issues).toHaveLength(1);
    expect(error.issues[0]).toEqual({
      code: "invalid_type",
      expected: "string",
      received: "undefined",
      path: [path],
      message: "Required",
    });
  };

  describe("invalid request input", () => {
    const { req } = newZodValidator(pathMap);
    const keys: (keyof AnySpecValidator)[] = [
      "query",
      "params",
      "body",
      "headers",
    ];
    it.each(keys)("%s", (key) => {
      const { data: reqV, error } = req({
        ...validReqInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeUndefined();
      if (error !== undefined) {
        return;
      }
      const { data, error: error2 } = reqV[key]();
      expect(data).toBeUndefined();
      if (data) {
        return;
      }
      checkZodError(error2, `${key}Name`);
    });
  });
  describe("invalid response input", () => {
    const { res } = newZodValidator(pathMap);
    const keys: (keyof AnyResponseSpecValidator)[] = ["body", "headers"];
    it.each(keys)("%s", (key) => {
      const { data: reqV, error } = res({
        ...validResInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeUndefined();
      if (error !== undefined) {
        return;
      }
      const { data, error: error2 } = reqV[key]();
      expect(data).toBeUndefined();
      if (data) {
        return;
      }
      checkZodError(error2, `${key}NameRes`);
    });
  });

  describe("invalid validator input", () => {
    describe("method", () => {
      const method = "noexist-method";
      it("request", () => {
        const { req } = newZodValidator(pathMap);
        const { data: validator, error } = req({
          ...validReqInput,
          method,
        });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newMethodInvalidError(method));
      });

      it("response", () => {
        const { res } = newZodValidator(pathMap);
        const { data: validator, error } = res({
          ...validResInput,
          method,
        });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newMethodInvalidError(method));
      });
    });
    describe("path", () => {
      const path = "noexist-path";
      it("request", () => {
        const { req } = newZodValidator(pathMap);
        const { data: validator, error } = req({ ...validReqInput, path });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });

      it("response", () => {
        const { res } = newZodValidator(pathMap);
        const { data: validator, error } = res({ ...validResInput, path });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });
    });
  });
});
