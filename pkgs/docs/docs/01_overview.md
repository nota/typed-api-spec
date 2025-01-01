---
sidebar_position: 1
---

# Overview

typed-api-spec is an TypeScript based declarative API specification.

## Features

### TypeScript based API Specification
You can define your API specification using TypeScript.
No need to use yaml, json, or any other format.

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: {
      responses: { 200: { body: { userNames: string[] }; }; };
    };
  };
}>;
```

See [API Specification](/docs/api-specification) page for more details.

### Type-safe, zero-runtime API client
typed-api-spec provides strict typed [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch).
For example, if you define API response schema by [API Specification](/docs/api-specification), you can get the typed response data.
It is just native [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch), so:
- zero runtime: 0kb bundle size
- zero dependencies
- zero learning cost

```typescript
const fetchT = fetch as FetchT<"", Spec>;
const res = await fetchT("/users");
const data = await res.json(); // data is { userNames: string[] }
```
 
See [Client](/docs/client/overview) page for more details.

### Server Framework & Validation library integration
typed-api-spec can be integrated with various server frameworks(like [Express](https://expressjs.com/), [Fastify](https://fastify.dev/)) and validation libraries(like [zod](https://zod.dev/), [Valibot](https://valibot.dev/)).

See [Server](/docs/category/server) and [Validation](/docs/category/validation) page for more details.