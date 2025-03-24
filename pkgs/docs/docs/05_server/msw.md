# MSW (Mock Service Worker)

MSW is an API mocking library that allows you to write client-agnostic mocks and reuse them across any frameworks, tools, and environments.

typed-api-spec provides first-class support for MSW. You can apply types to your MSW handlers using the `newHttp()` function.

Here is an example of how to use `msw` with `typed-api-spec` and `zod`.

```typescript
import { setupServer } from "msw/node";
import { newHttp, ApiEndpointsSchema } from "@notainc/typed-api-spec/msw";
import { z } from "zod";

// Define a type-safe API schema using Zod
const endpoints = {
  "/users": {
    get: {
      responses: { 200: { body: z.object({ id: z.string() }) } },
    },
  },
} satisfies ApiEndpointsSchema;

const baseUrl = "https://example.com";

// http is same as msw's `http` object but more strict type checking
const http = newHttp(baseUrl, endpoints);

const handlers = [
  // path will be validated against the schema
  http.get(`${baseUrl}/users`, ({ response }) => {
    return response.json({
      id: "1", // Type-checked against the schema
    });
  }),
];

// Setup MSW server with typed handlers
const server = setupServer(...handlers);
server.listen();
```

## Extra args of request handler

The request handlers created by `newHttp()` receive an object with additional properties beyond the standard MSW handler parameters. These extra arguments provide type-safe access to request data and validation methods.

```typescript
http.get(`${baseUrl}/users`, (info) => {
  // Validate query parameters
  const query = await info.validate.query();
  if (query.issues) {
    return info.response.json(
      { message: "Invalid query parameters" },
      { status: 400 }
    );
  }
  // info contains typed helpers and validation methods
  return info.response.json({ id: "1" });
});
```

### validate

`validate` is a object which have functions that validates the request.
Available methods are `query()`, `params()`, `headers()`, and `body()`.

### response

response is typed version of MSW's HttpResponse.

## API

### newHttp()

`newHttp()` is a function that creates an MSW http handler. The returned object is almost same as MSW's `http`, but more strict type checking is available.

```typescript
const endpoints = {...} satisfies ApiEndpointsSchema;

const http = newHttp('https://example.com', endpoints);

// Type-safe handler
http.get(`${baseUrl}/users`, ({ response }) => {
  // response.json() is type-checked against the schema
  return response.json({ users: ["user1", "user2"] });
});
```
