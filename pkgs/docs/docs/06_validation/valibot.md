---
sidebar_position: 2
---

# Valibot

[valibot](https://valibot.dev) is the open source schema library for TypeScript with bundle size, type safety and developer experience in mind.
You can use valibot to define the API specification of typed-api-spec.

```typescript
import * as v from "valibot";

const Spec = {
  "/users/:id": {
    get: {
      params: v.object({ id: v.string() }),
      query: v.object({ page: v.string().optional() }),
      headers: v.object({ "x-api-key": v.string() }),
      responses: {
        200: {
          headers: v.object({ "content-type": v.literal("application/json") }),
          body: v.object({ userNames: v.array(v.string()) }),
        },
      },
    },
  },
} satisfies ValibotApiEndpoints;
```

### Using server integration

If you use `express`, you can use official integration to validate request parameters based on the API specification.
See the [express](/docs/server/express) page for more information.

## OpenAPI

You can generate OpenAPI documentation from the API schema written by TypeScript and valibot.
If you do so, you should:

- Use `ValibotOpenApiEndpoints` instead of `ValibotApiEndpoints`
- Define extra properties that are required for OpenAPI documentation like `summary`, `description`, `tags`, etc.
- Use `toOpenApiDoc()` function to generate OpenAPI documentation.

```typescript
import * as v from "valibot";
const apiEndpoints = {
  "/pets/:petId": {
    get: {
      summary: "Find pet by ID",
      description: "Returns a single pet",
      tags: ["pets"],
      params: v.object({ petId: v.string() }),
      query: v.object({ page: v.string() }),
      responses: {
        200: {
          body: v.object({ name: v.string() }),
          description: "List of pets",
        },
      },
    },
  },
} satisfies ValibotOpenApiEndpoints;
```

ValibotOpenApiEndpoints allows to define extra properties that are required for OpenAPI documentation like `summary`, `description`, `tags`, etc.

### Generating OpenAPI Documentation

You can generate an OpenAPI specification using by the `toOpenApiDoc()` function.
You can serve OpenAPI endpoint by serving the generated OpenAPI object as JSON.
Here is an example of how to serve OpenAPI documentation using Express.

```typescript
import { toOpenApiDoc } from "@notainc/typed-api-spec/valibot/openapi";
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
