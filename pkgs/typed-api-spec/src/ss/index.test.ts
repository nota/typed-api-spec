import { describe, it, expect } from "vitest";
import { newSSValidator, SSApiEndpoints } from "./index";
import * as v from "valibot";
import { newValidatorPathNotFoundError } from "../core/validator/validate";
import { AnyResponseSpecValidator } from "../core/validator/response";
import { AnySpecValidator } from "../core/validator/request";
import { newMethodInvalidError } from "../core";
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
  } satisfies SSApiEndpoints;

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
    const { req, res } = newSSValidator(pathMap);
    const { data: reqV, error } = await req(validReqInput);
    expect(error).toBeUndefined();
    if (error) {
      return;
    }
    expect(await reqV["query"]()).toEqual({ data: { queryName: "queryName" } });
    expect(await reqV["params"]()).toEqual({
      data: { paramsName: "paramsName" },
    });
    expect(await reqV["body"]()).toEqual({ data: { bodyName: "bodyName" } });
    expect(await reqV["headers"]()).toEqual({
      data: { headersName: "headersName" },
    });

    const { data: resV, error: resE } = await res(validResInput);
    expect(resE).toBeUndefined();
    if (resE) {
      return;
    }
    expect(await resV["body"]()).toEqual({
      data: { bodyNameRes: "bodyNameRes" },
    });
    expect(await resV["headers"]()).toEqual({
      data: { headersNameRes: "headersNameRes" },
    });
  });

  const checkSSError = (issues: StandardSchemaV1.Issue[], path: string) => {
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
    const { req } = newSSValidator(pathMap);
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
      const { data, error: error2 } = await reqV[key]();
      expect(data).toBeUndefined();
      if (data) {
        return;
      }
      checkSSError(error2, `${key}Name`);
    });
  });
  describe("invalid response input", () => {
    const { res } = newSSValidator(pathMap);
    const keys: (keyof AnyResponseSpecValidator)[] = ["body", "headers"];
    it.each(keys)("%s", async (key) => {
      const { data: reqV, error } = await res({
        ...validResInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeUndefined();
      if (error) {
        return;
      }
      const { data, error: error2 } = await reqV[key]();
      expect(data).toBeUndefined();
      if (data) {
        return;
      }
      console.log("invalidt response input", key, error2);
      checkSSError(error2, `${key}NameRes`);
    });
  });

  describe("invalid validator input", () => {
    describe("method", () => {
      const method = "noexist-method";
      it("request", () => {
        const { req } = newSSValidator(pathMap);
        const { data: validator, error } = req({ ...validReqInput, method });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newMethodInvalidError(method));
      });

      it("response", () => {
        const { res } = newSSValidator(pathMap);
        const { data: validator, error } = res({ ...validResInput, method });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newMethodInvalidError(method));
      });
    });
    describe("path", () => {
      const path = "noexist-path";
      it("request", () => {
        const { req } = newSSValidator(pathMap);
        const { data: validator, error } = req({ ...validReqInput, path });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });

      it("response", () => {
        const { res } = newSSValidator(pathMap);
        const { data: validator, error } = res({ ...validResInput, path });
        expect(validator).toBeUndefined();
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });
    });
  });
});
