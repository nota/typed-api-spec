import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { asAsync, ValidateLocals, validatorMiddleware } from "./index";
import {
  newZodValidator,
  ZodApiEndpoints,
  ZodApiSpec,
  ZodValidators,
} from "../zod";
import { z, ZodError } from "zod";
import { Request } from "express";
import { ParseUrlParams } from "../core";
import { ToHandlers, typed } from "./zod";
import {
  newValidatorMethodNotFoundError,
  newValidatorPathNotFoundError,
} from "../core/validator/validate";

type ZodValidateLocals<
  AS extends ZodApiSpec,
  ParamKeys extends string,
> = ValidateLocals<ZodValidators<AS, ParamKeys>>;

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
  } satisfies ZodApiEndpoints;
  const { req: reqValidator } = newZodValidator(pathMap);
  const middleware = validatorMiddleware(reqValidator);
  const next = vi.fn();

  describe("request to endpoint which is defined in ApiSpec", () => {
    it("should success to validate request", () => {
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
      const locals = res.locals as ZodValidateLocals<
        (typeof pathMap)["/"]["get"],
        ParseUrlParams<"/">
      >;
      const validate = locals.validate(req as Request);

      {
        const r = validate.query();
        expect(r.error).toBeUndefined();
        expect(r.data?.name).toBe("alice");
      }

      {
        const r = validate.body();
        expect(r.error).toBeUndefined();
        expect(r.data?.name).toBe("alice");
      }

      {
        const r = validate.headers();
        expect(r.error).toBeUndefined();
        expect(r.data?.["content-type"]).toBe("application/json");
      }
    });

    it("should fail if request schema is invalid", () => {
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
      const locals = res.locals as ZodValidateLocals<
        (typeof pathMap)["/"]["get"],
        ParseUrlParams<"/">
      >;
      const validate = locals.validate(req as Request);

      {
        const r = validate.query();
        expect(r.error).toEqual(
          new ZodError([
            {
              code: "invalid_type",
              expected: "string",
              received: "undefined",
              path: ["name"],
              message: "Required",
            },
          ]),
        );
        expect(r.data).toBeUndefined();
      }

      {
        const r = validate.body();
        expect(r.error).toEqual(
          new ZodError([
            {
              code: "invalid_type",
              expected: "string",
              received: "undefined",
              path: ["name"],
              message: "Required",
            },
          ]),
        );
        expect(r.data).toBeUndefined();
      }

      const r = validate.headers();
      expect(r.error).toEqual(
        new ZodError([
          {
            code: "invalid_literal",
            expected: "application/json",
            received: undefined,
            path: ["content-type"],
            message: `Invalid literal value, expected "application/json"`,
          },
        ]),
      );
      expect(r.data).toBeUndefined();
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
      const locals = res.locals as ZodValidateLocals<
        ZodApiSpec,
        ParseUrlParams<"">
      >;
      const validate = locals.validate(req as Request);
      const pathErrorResult = {
        data: undefined,
        error: newValidatorPathNotFoundError("/users"),
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
      const locals = res.locals as ZodValidateLocals<any, ParseUrlParams<"">>;
      const validate = locals.validate(req as Request);
      const methodErrorResult = {
        data: undefined,
        error: newValidatorMethodNotFoundError("patch"),
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
          detail: z.union([z.literal("true"), z.literal("false")]),
        }),
        responses: {
          200: { body: User },
          ...BadRequest,
        },
      },
    },
  } satisfies ZodApiEndpoints;

  it("ok", async () => {
    const app = newApp();
    const wApp = typed(pathMap, app);
    wApp.get("/users", (req, res) => {
      return res.json([{ id: "1", name: "alice" }]);
    });
    wApp.post("/users", (req, res) => {
      const { data } = res.locals.validate(req).body();
      if (data === undefined) {
        return res.status(400).json({ message: "invalid body" });
      }
      return res.json({ id: "1", name: data.name });
    });
    wApp.get("/users/:id", (req, res) => {
      const qResult = res.locals.validate(req).query();
      const pResult = res.locals.validate(req).params();
      if (pResult.data === undefined) {
        return res.status(400).json({ message: "invalid query" });
      }
      if (qResult.data !== undefined) {
        return res.status(200).json({ id: pResult.data.id, name: "alice" });
      }
      return res.status(200).json({ id: pResult.data.id, name: "alice" });
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
    } satisfies ZodApiEndpoints;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getHandler: ToHandlers<typeof pathMap>["/users"]["get"] = (
      req,
      res,
    ) => {
      const { data: query, error: queryErr } = res.locals.validate(req).query();
      if (queryErr) {
        return res.status(400).json({ message: "invalid query" });
      }
      const { data: params, error: paramsErr } = res.locals
        .validate(req)
        .params();
      if (paramsErr) {
        return res.status(400).json({ message: "invalid params" });
      }
      return res.json([{ id: "1", name: query.name, active: params.active }]);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const postHandler: ToHandlers<typeof pathMap>["/users"]["post"] = (
      req,
      res,
    ) => {
      const { data: body, error: bodyError } = res.locals.validate(req).body();
      if (bodyError) {
        return res.status(400).json({ message: "invalid query" });
      }
      return res.json([{ id: "1", name: body.name }]);
    };
  });
});
