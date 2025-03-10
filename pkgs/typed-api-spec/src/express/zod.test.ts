import { describe, it, expect, vi, assert } from "vitest";
import request from "supertest";
import express from "express";
import { asAsync, ValidateLocals, validatorMiddleware } from "./index";
import { z } from "zod";
import { Request } from "express";
import { ParseUrlParams } from "../core";
import { ToHandlers, typed } from "./zod";
import {
  newValidatorMethodNotFoundError,
  newValidatorPathNotFoundError,
} from "../core/validator/validate";
import { newSSValidator, SSApiEndpoints, SSApiSpec, SSValidators } from "../ss";

type SSValidateLocals<
  AS extends SSApiSpec,
  ParamKeys extends string,
> = ValidateLocals<SSValidators<AS, ParamKeys>>;

describe("validatorMiddleware", () => {
  const pathMap = {
    "/": {
      get: {
        query: z.object({
          name: z.string(),
        }),
        // typed-api-spec allows to define body in GET method, but it is not recommended
        body: z.object({
          name: z.string(),
        }),
        headers: z.object({
          "content-type": z.literal("application/json"),
        }),
        params: z.object({
          name: z.string(),
        }),
        responses: {
          200: {
            body: z.object({
              id: z.string(),
              name: z.string(),
            }),
          },
          400: {
            body: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  } satisfies SSApiEndpoints;
  const { req: reqValidator } = newSSValidator(pathMap);
  const middleware = validatorMiddleware(reqValidator);
  const next = vi.fn();

  describe("request to endpoint which is defined in ApiSpec", () => {
    it("should success to validate request", async () => {
      const req: Partial<Request> = {
        query: { name: "alice" },
        body: { name: "alice" },
        headers: { "content-type": "application/json" },
        params: { name: "alice" },
        // "/" endpoint is defined in pathMap
        route: { path: "/" },
        method: "get",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      const locals = res.locals as SSValidateLocals<
        (typeof pathMap)["/"]["get"],
        ParseUrlParams<"/">
      >;
      const validate = locals.validate(req as Request);

      {
        const r = await validate.query();
        if (r.issues) {
          assert.fail("issue must be empty");
        } else {
          expect(r.value.name).toBe("alice");
        }
      }

      {
        const r = await validate.body();
        if (r.issues) {
          assert.fail("issue must be empty");
        } else {
          expect(r.value.name).toBe("alice");
        }
      }

      {
        const r = await validate.headers();
        if (r.issues) {
          assert.fail("issue must be empty");
        } else {
          expect(r.value["content-type"]).toBe("application/json");
        }
      }
    });

    it("should fail if request schema is invalid", async () => {
      const req: Partial<Request> = {
        query: { desc: "test" },
        body: { desc: "test" },
        headers: {},
        params: { desc: "test" },
        // "/" endpoint is defined in pathMap
        route: { path: "/" },
        method: "get",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      const locals = res.locals as SSValidateLocals<
        (typeof pathMap)["/"]["get"],
        ParseUrlParams<"/">
      >;
      const validate = locals.validate(req as Request);

      {
        const r = await validate.query();
        if (r.issues) {
          expect(r.issues).toEqual([
            {
              code: "invalid_type",
              expected: "string",
              received: "undefined",
              path: ["name"],
              message: "Required",
            },
          ]);
        } else {
          assert.fail("issue must be exist");
        }
      }

      {
        const r = await validate.body();
        if (r.issues) {
          expect(r.issues).toEqual([
            {
              code: "invalid_type",
              expected: "string",
              received: "undefined",
              path: ["name"],
              message: "Required",
            },
          ]);
        } else {
          assert.fail("issue must be exist");
        }
      }

      const r = await validate.headers();
      if (r.issues) {
        expect(r.issues).toEqual([
          {
            code: "invalid_literal",
            expected: "application/json",
            received: undefined,
            path: ["content-type"],
            message: `Invalid literal value, expected "application/json"`,
          },
        ]);
      } else {
        assert.fail("issue must be exist");
      }
    });
  });

  describe("request to endpoint which is not defined in ApiSpec", () => {
    it("have invalid path and valid method", () => {
      const req: Partial<Request> = {
        query: { name: "alice" },
        body: { name: "alice" },
        headers: { "content-type": "application/json" },
        params: { name: "alice" },
        // "/users" endpoint is not defined in pathMap
        route: { path: "/users" },
        method: "get",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      const locals = res.locals as SSValidateLocals<
        SSApiSpec,
        ParseUrlParams<"">
      >;
      const validate = locals.validate(req as Request);
      const pathErrorResult = {
        value: undefined,
        issues: [newValidatorPathNotFoundError("/users")],
      };

      expect(validate.query?.()).toEqual(pathErrorResult);
      expect(validate.body?.()).toEqual(pathErrorResult);
      expect(validate.headers?.()).toEqual(pathErrorResult);
      expect(validate.params?.()).toEqual(pathErrorResult);
    });

    it("have valid path and invalid method", () => {
      const req: Partial<Request> = {
        query: { name: "alice" },
        body: { name: "alice" },
        headers: { "content-type": "application/json" },
        params: { name: "alice" },
        // "/" endpoint is defined but patch method is not defined in pathMap
        route: { path: "/" },
        method: "patch",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as unknown as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const locals = res.locals as SSValidateLocals<any, ParseUrlParams<"">>;
      const validate = locals.validate(req as Request);
      const methodErrorResult = {
        value: undefined,
        issues: [newValidatorMethodNotFoundError("patch")],
      };

      expect(validate.query?.()).toEqual(methodErrorResult);
      expect(validate.body?.()).toEqual(methodErrorResult);
      expect(validate.headers?.()).toEqual(methodErrorResult);
      expect(validate.params?.()).toEqual(methodErrorResult);
    });
  });
});

const newApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};
describe("typed", () => {
  const UserId = z.object({ id: z.string() });
  const UserName = z.object({ name: z.string() });
  const User = UserName.merge(UserId);
  const Err = z.object({ message: z.string() });
  const BadRequest = { 400: { body: Err } };
  const pathMap = {
    "/users": {
      get: {
        responses: { 200: { body: z.array(User) } },
      },
      post: {
        body: UserName,
        responses: { 200: { body: User }, ...BadRequest },
      },
    },
    "/users/:id": {
      get: {
        params: z.object({ id: z.string() }),
        headers: z.object({
          "content-type": z.literal("application/json"),
        }),
        query: z.object({
          detail: z.union([z.literal("true"), z.literal("false")]).optional(),
        }),
        responses: {
          200: { body: User },
          ...BadRequest,
        },
      },
    },
  } satisfies SSApiEndpoints;

  it("ok", async () => {
    const app = newApp();
    const wApp = typed(pathMap, app);
    wApp.get("/users", (req, res) => {
      return res.json([{ id: "1", name: "alice" }]);
    });
    wApp.post("/users", async (req, res) => {
      const r = await res.locals.validate(req).body();
      if (r.issues) {
        return res.status(400).json({ message: "invalid body" });
      }

      return res.json({ id: "1", name: r.value.name });
    });
    wApp.get("/users/:id", async (req, res) => {
      const qResult = await res.locals.validate(req).query();
      const pResult = await res.locals.validate(req).params();
      if (qResult.issues) {
        return res.status(400).json({ message: "invalid query" });
      }
      if (pResult.issues) {
        return res.status(400).json({ message: "invalid params" });
      }
      return res.status(200).json({ id: pResult.value.id, name: "alice" });
    });

    {
      const res = await request(app).get("/users");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: "1", name: "alice" }]);
    }

    {
      const res = await request(app).post("/users").send({ name: "alice" });
      console.log(res.body);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: "1", name: "alice" });
    }

    {
      const res = await request(app).get("/users/99");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: "99", name: "alice" });
    }
  });
});

describe("asAsync", () => {
  describe("", () => {
    it("ok", async () => {
      const routerGet = vi.fn();
      const routerMethod = vi.fn();
      const app = asAsync({
        get: routerGet,
        noMethod: 1,
        method: routerMethod,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      // getやpostなどのメソッドを呼んだ時だけ、ラップされた関数が返ってくる
      expect(app.get).not.toBe(routerGet);
      expect(app.method).toBe(routerMethod);
      expect(app.noMethod).toBe(1);
    });
  });
  describe("async handler", () => {
    it("ok", async () => {
      const app = asAsync(newApp());
      app.get("/path", async (req, res) => {
        res.status(200).json({ message: "success" });
      });
      const res = await request(app).get("/path");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });
    });
    it("error", async () => {
      const app = asAsync(newApp());
      app.get("/path", async () => {
        throw new Error("error");
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
      app.use((err: any, req: any, res: any, _next: any) => {
        res.status(501).json({ message: "xxx" });
      });
      const res = await request(app).get("/path");
      expect(res.status).toBe(501);
      expect(res.body).toEqual({ message: "xxx" });
    });
  });
  describe("sync handler", () => {
    it("ok", async () => {
      const app = asAsync(newApp());
      app.get("/path", (req, res) => {
        res.status(200).json({ message: "success" });
      });
      const res = await request(app).get("/path");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });
    });
    it("error", async () => {
      const app = asAsync(newApp());
      app.get("/path", () => {
        throw new Error("error");
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
      app.use((err: any, req: any, res: any, _next: any) => {
        res.status(501).json({ message: "xxx" });
      });
      const res = await request(app).get("/path");
      expect(res.status).toBe(501);
      expect(res.body).toEqual({ message: "xxx" });
    });
  });
});

describe("Handler", () => {
  it("ok", async () => {
    const pathMap = {
      "/users": {
        get: {
          params: z.object({ active: z.string() }),
          query: z.object({ name: z.string() }),
          responses: {
            200: {
              body: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  active: z.string(),
                }),
              ),
            },
            400: { body: z.object({ message: z.string() }) },
          },
        },
        post: {
          body: z.object({ name: z.string() }),
          responses: {
            200: {
              body: z.array(z.object({ id: z.string(), name: z.string() })),
            },
            400: { body: z.object({ message: z.string() }) },
          },
        },
      },
    } satisfies SSApiEndpoints;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getHandler: ToHandlers<typeof pathMap>["/users"]["get"] = async (
      req,
      res,
    ) => {
      const queryResult = await res.locals.validate(req).query();
      if (queryResult.issues) {
        return res.status(400).json({ message: "invalid query" });
      }
      const paramsResult = await res.locals.validate(req).params();
      if (paramsResult.issues) {
        return res.status(400).json({ message: "invalid params" });
      }
      return res.json([
        {
          id: "1",
          name: queryResult.value.name,
          active: paramsResult.value.active,
        },
      ]);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const postHandler: ToHandlers<typeof pathMap>["/users"]["post"] = async (
      req,
      res,
    ) => {
      const bodyResult = await res.locals.validate(req).body();
      if (bodyResult.issues) {
        return res.status(400).json({ message: "invalid query" });
      }
      return res.json([{ id: "1", name: bodyResult.value.name }]);
    };
  });
});
