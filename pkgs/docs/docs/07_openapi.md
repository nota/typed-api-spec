---
sidebar_position: 7
---

# OpenAPI (Experimental)

The [OpenAPI](https://swagger.io/specification) Specification (OAS) defines a standard, language-agnostic interface to HTTP APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection.

In typed-api-spec, you can generate OpenAPI documentation from API schema written by TypeScript.

## Define API Endpoints

For example, consider the case of defining a schema using zod.
If you want to generate an OpenAPI schema, use `OpenApiEndpointsSchema` instead of `ApiEndpointsSchema`.

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
} satisfies OpenApiEndpointsSchema;
```

OpenApiEndpointsSchema allows to define extra properties that are required for OpenAPI documentation like `summary`, `description`, `tags`, etc.

## Generating OpenAPI Documentation

You can generate an OpenAPI specification using by the `toOpenApiDoc()` function.
You can serve OpenAPI endpoint by serving the generated OpenAPI object as JSON.
Here is an example of how to serve OpenAPI documentation using Express.

```typescript
const app = express();
...

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

app.get("/openapi", (req, res) => {
  const openapi = toOpenApiDoc(openapiBaseDoc, apiEndpoints);
  res.status(200).json(openapi);
});
```

## Swagger UI

You can use [Swagger UI](https://swagger.io/tools/swagger-ui/) to visualize and interact with the API's resources.

[![Image from Gyazo](https://i.gyazo.com/e8489d011b00c4a635d269d09e37c237.png)](https://gyazo.com/e8489d011b00c4a635d269d09e37c237)
