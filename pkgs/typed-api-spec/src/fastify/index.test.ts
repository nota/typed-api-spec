import { describe, it, expect, vi, afterEach } from "vitest";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { toRoutes, toSchema } from "./index";
import { ApiEndpointsSchema } from "../core/schema";

const pathMap = {
  "/users": {
    get: {
      query: z.object({ page: z.string() }),
      responses: {
        200: { body: z.object({ userNames: z.string().array() }) },
      },
    },
    post: {
      body: z.object({ userName: z.string() }),
      responses: {
        200: { body: z.object({ userId: z.string() }) },
      },
    },
  },
} satisfies ApiEndpointsSchema;

const newServer = () => {
  const fastify = Fastify();
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  return fastify;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toSchema", () => {
  it("does not contain keys which are not defined in the spec", () => {
    const schema = toSchema(pathMap["/users"]["get"]);
    expect(Object.keys(schema).sort()).toEqual(["querystring", "response"]);
  });

  it("contains every key which is defined in the spec", () => {
    const spec = {
      query: z.object({ page: z.string() }),
      params: z.object({ userId: z.string() }),
      body: z.object({ userName: z.string() }),
      headers: z.object({ "content-type": z.literal("application/json") }),
      responses: { 200: { body: z.object({ userName: z.string() }) } },
    } satisfies ApiEndpointsSchema[string]["get"];
    const schema = toSchema(spec);
    expect(Object.keys(schema).sort()).toEqual([
      "body",
      "headers",
      "params",
      "querystring",
      "response",
    ]);
    expect(schema.querystring).toBe(spec.query);
    expect(schema.params).toBe(spec.params);
    expect(schema.body).toBe(spec.body);
    expect(schema.headers).toBe(spec.headers);
  });
});

describe("toRoutes", () => {
  it("registers routes without FSTWRN001 warnings", async () => {
    const emitWarning = vi.spyOn(process, "emitWarning");
    const fastify = newServer();
    const routes = toRoutes(pathMap);
    fastify.route({
      ...routes["/users"]["get"],
      handler: async () => ({ userNames: ["user1"] }),
    });
    fastify.route({
      ...routes["/users"]["post"],
      handler: async () => ({ userId: "user1#0" }),
    });
    await fastify.ready();

    // process.emitWarning() is called as (message, name, code) by fastify
    const warned = emitWarning.mock.calls.flat().map((arg) => String(arg));
    expect(warned).not.toContain("FSTWRN001");
    await fastify.close();
  });

  it("keeps validating the parts which the spec defines", async () => {
    const fastify = newServer();
    const routes = toRoutes(pathMap);
    fastify.route({
      ...routes["/users"]["get"],
      handler: async () => ({ userNames: ["user1"] }),
    });
    await fastify.ready();

    const ok = await fastify.inject({ method: "GET", url: "/users?page=1" });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toEqual({ userNames: ["user1"] });

    const ng = await fastify.inject({ method: "GET", url: "/users" });
    expect(ng.statusCode).toBe(400);
    await fastify.close();
  });
});
