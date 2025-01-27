---
sidebar_position: 1
---

# zod

[zod](https://zod.dev) is a TypeScript-first schema declaration and validation library.
You can use zod to define the API specification of typed-api-spec.

```typescript
import { z } from "zod";

const Spec = {
  "/users/:id": {
    get: {
      params: z.object({ id: z.string() }),
      query: z.object({ page: z.string().optional() }),
      headers: z.object({ "x-api-key": z.string() }),
      responses: {
        200: {
          headers: z.object({ "content-type": z.literal("application/json") }),
          body: z.object({ userNames: z.array(z.string()) }),
        },
      },
    },
  },
} satisfies ZodApiEndpoints;
```

## Using server integration

If you use `express` or `fastify`, you can use official integration to validate request parameters based on the API specification.
See the [express](/docs/server/express) or [fastify](/docs/server/fastify) page for more information.

## OpenAPI

You can generate OpenAPI documentation from the API schema written by TypeScript and zod.
If you do so, you should:

- Use `ZodOpenApiEndpoints` instead of `ZodApiEndpoints`
- Define extra properties that are required for OpenAPI documentation like `summary`, `description`, `tags`, etc.
- Install `zod-openapi` package and import it.
- Use `toOpenApiDoc()` function to generate OpenAPI documentation.

```typescript
const apiEndpoints = {
  "/pets/:petId": {
    get: {
      summary: "Find pet by ID",
      description: "Returns a single pet",
      tags: ["pets"],
      params: z.object({ petId: z.string() }),
      query: z.object({ page: z.string() }),
      responses: {
        200: {
          body: z.object({ name: z.string() }),
          description: "List of pets",
        },
      },
    },
  },
} satisfies ZodOpenApiEndpoints;
```

ZodOpenApiEndpoints allows to define extra properties that are required for OpenAPI documentation like `summary`, `description`, `tags`, etc.

### Generating OpenAPI Documentation

You can generate an OpenAPI specification using by the `toOpenApiDoc()` function.
You can serve OpenAPI endpoint by serving the generated OpenAPI object as JSON.
Here is an example of how to serve OpenAPI documentation using Express.

```typescript
import { toOpenApiDoc } from "@notainc/typed-api-spec/zod/openapi";
const openapiBaseDoc: Omit<OpenAPIV3_1.Document, "paths"> = {
  openapi: "3.1.0",
  servers: [{ url: "http://locahost:3000" }],
  info: {
    title: "typed-api-spec OpenAPI Example",
    version: "1",
    description:
      "This is a sample Pet Store Server based on the OpenAPI 3.1 specification.",
  },
  tags: [{ name: "pets", description: "Everything about your Pets" }],
};

const openapi = toOpenApiDoc(openapiBaseDoc, apiEndpoints);
```
