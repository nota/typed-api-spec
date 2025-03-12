import { describe, it, expect, assert } from "vitest";
import { ApiEndpointsSchema } from "./schema";
import * as v from "valibot";
import {
  newValidator,
  newValidatorPathNotFoundError,
} from "./validator/validate";
import { AnyResponseSpecValidator } from "./validator/response";
import { AnySpecValidator } from "./validator/request";
import { newMethodInvalidError } from ".";
import { StandardSchemaV1 } from "@standard-schema/spec";

describe("newSSValidator", () => {
  const pathMap = {
    "/": {
      get: {
        query: v.object({ queryName: v.string() }),
        body: v.object({ bodyName: v.string() }),
        headers: v.object({ headersName: v.string() }),
        params: v.object({ paramsName: v.string() }),
        responses: {
          200: {
            body: v.object({ bodyNameRes: v.string() }),
            headers: v.object({ headersNameRes: v.string() }),
          },
        },
      },
    },
  } satisfies ApiEndpointsSchema;

  const validReqInput = {
    path: "/",
    method: "get",
    params: { paramsName: "paramsName" },
    query: { queryName: "queryName" },
    body: { bodyName: "bodyName" },
    headers: { headersName: "headersName" },
  } as const;

  const validResInput = {
    path: "/",
    method: "get",
    statusCode: 200,
    body: { bodyNameRes: "bodyNameRes" },
    headers: { headersNameRes: "headersNameRes" },
  } as const;

  it("ok", async () => {
    const { req, res } = newValidator(pathMap);
    const { data: reqV, error } = req(validReqInput);
    expect(error).toBeUndefined();
    if (error) {
      return;
    }
    expect(await reqV["query"]()).toEqual({
      typed: true,
      value: { queryName: "queryName" },
    });
    expect(await reqV["params"]()).toEqual({
      typed: true,
      value: { paramsName: "paramsName" },
    });
    expect(await reqV["body"]()).toEqual({
      typed: true,
      value: { bodyName: "bodyName" },
    });
    expect(await reqV["headers"]()).toEqual({
      typed: true,
      value: { headersName: "headersName" },
    });

    const { data: resV, error: resE } = res(validResInput);
    expect(resE).toBeUndefined();
    if (resE) {
      return;
    }
    expect(await resV["body"]()).toEqual({
      typed: true,
      value: { bodyNameRes: "bodyNameRes" },
    });
    expect(await resV["headers"]()).toEqual({
      typed: true,
      value: { headersNameRes: "headersNameRes" },
    });
  });

  const checkSSError = (
    issues: Readonly<StandardSchemaV1.Issue[]>,
    path: string,
  ) => {
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      abortEarly: undefined,
      abortPipeEarly: undefined,
      expected: "string",
      input: undefined,
      issues: undefined,
      kind: "schema",
      lang: undefined,
      message: "Invalid type: Expected string but received undefined",
      path: [
        {
          input: {
            invalid: "invalidValue",
          },
          key: path,
          origin: "value",
          type: "object",
          value: undefined,
        },
      ],
      received: "undefined",
      requirement: undefined,
      type: "string",
    });
  };

  describe("invalid request input", () => {
    const { req } = newValidator(pathMap);
    const keys: (keyof AnySpecValidator)[] = [
      "query",
      "params",
      "body",
      "headers",
    ];
    it.each(keys)("%s", async (key) => {
      const { data: reqV, error } = req({
        ...validReqInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeUndefined();
      if (error) {
        return;
      }
      const r = await reqV[key]();
      if (r.issues) {
        checkSSError(r.issues, `${key}Name`);
      } else {
        assert.fail("issues must be exist");
      }
    });
  });
  describe("invalid response input", () => {
    const { res } = newValidator(pathMap);
    const keys: (keyof AnyResponseSpecValidator)[] = ["body", "headers"];
    it.each(keys)("%s", async (key) => {
      const { data: resV, error } = await res({
        ...validResInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeUndefined();
      if (error) {
        return;
      }
      const r = await resV[key]();
      if (r.issues) {
        checkSSError(r.issues, `${key}NameRes`);
      } else {
        assert.fail("issues must be exist");
      }
    });
  });

  describe("invalid validator input", () => {
    describe("method", () => {
      const method = "noexist-method";
      it("request", () => {
        const { req } = newValidator(pathMap);
        const { data: validator, error } = req({ ...validReqInput, method });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newMethodInvalidError(method));
      });

      it("response", () => {
        const { res } = newValidator(pathMap);
        const { data: validator, error } = res({ ...validResInput, method });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newMethodInvalidError(method));
      });
    });
    describe("path", () => {
      const path = "noexist-path";
      it("request", () => {
        const { req } = newValidator(pathMap);
        const { data: validator, error } = req({ ...validReqInput, path });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });

      it("response", () => {
        const { res } = newValidator(pathMap);
        const { data: validator, error } = res({ ...validResInput, path });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });
    });
  });
});
