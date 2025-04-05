---
sidebar_position: 0
---

# Client(zero-fetch)

typed-api-spec provides `zero-fetch`, a type-safe, zero-runtime API client.

:::info[What does **zero-runtime** mean?]

zero-fetch just add type information to native fetch, and does not add any runtime code.
Type information is erased during compilation, so it does not affect the runtime behavior.
As a result, it does not increase bundle size and does not have any runtime dependencies.

```typescript
// fetchT is just native fetch, so it does not have any additional runtime dependencies
const fetchT = fetch as FetchT<"", Spec>;
```

:::

## Type-safe features

### Response

zero-fetch provides type information for the response data based on the API specification.

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: {
      responses: { 200: { body: { names: string[] } } };
    };
  };
}>;

const fetchT = fetch as FetchT<"", Spec>;
const res = await fetchT("/users");
const data = await res.json(); // data is { userNames: string[] }
```

If the response have multiple status codes, response type is union of each status code type.

```typescript
type Headers = { headers: { "Content-Type": "application/json" } };
type Spec = DefineApiEndpoints<{
  "/users": {
    get: {
      responses: {
        200: { body: { names: string[] } } & Headers;
        201: { body: { ok: boolean } } & Headers;
        400: { body: { message: string } } & Headers;
        500: { body: { internalError: string } } & Headers;
      };
    };
  };
}>;

const fetchT = fetch as FetchT<"", Spec>;
const res = await fetchT("/users");
if (!res.ok) {
  // If res.ok is false, status code is 400 or 500
  // So res.json() returns { message: string } | { internalError: string }
  const data = await res.json();

  // Response headers are also type-checked. Content-Type is always 'application/json'
  const contentType: "application/json" = res.headers.get("Content-Type");
  // and, hasContentType is inferred as true, not boolean
  const hasContentType: true = res.headers.has("Content-Type");

  return console.error(data);
}
// If res.ok is true, status code is 200 or 201
// So res.json() returns { names: string[] } | { ok: boolean }
const data = await res.json(); // names is string[]
console.log(data);
```

:::info[Response headers limitation]

Response headers are treated as an immutable object for strict type checking.
It means that you can not `append`, `set` or `delete` operation after the response object is created.
This is a limitation of the type system, not a runtime change. If you need mutable operations, you can cast types.

```typescript
const immutableHeaders = res.headers;
const mutableHeaders = res.headers as Headers;
```

:::

### Path & Path parameters

zero-fetch accepts only the path that is defined in the API specification.
Path parameters are also supported as `:paramName` in the path.

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: { responses: { 200: { body: { names: string[] } } } };
  };
  "/users/:id": {
    get: { responses: { 200: { body: { name: string } } } };
  };
}>;
const fetchT = fetch as FetchT<"", Spec>;

await fetchT("/users"); // OK
await fetchT("/users/1"); // OK
await fetchT("/posts"); // Error: Argument of type '"/posts"' is not assignable to parameter of type '"/users" | "/users/:id"'.
await fetchT("/users/1/2"); // Error: Argument of type '"/users/1/2"' is not assignable to parameter of type '"/users" | "/users/:id"'.
```

### Query

zero-fetch accepts only the query parameters that are defined in the API specification.

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: {
      query: { page: string };
      responses: { 200: { body: { names: string[] } } };
    };
  };
}>;

const fetchT = fetch as FetchT<"", Spec>;
await fetchT("/users?page=1"); // OK
await fetchT("/users"); // Error: Argument of type string is not assignable to parameter of type MissingQueryError<"page">
await fetchT("/users?page=1&noexist=1"); // Error: Argument of type string is not assignable to parameter of type ExcessiveQueryError<"noexist">
```

### headers

zero-fetch accepts only the headers that are defined in the API specification.

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: {
      headers: { "x-api-key": string };
      responses: { 200: { body: { names: string[] } } };
    };
  };
}>;
const fetchT = fetch as FetchT<"", Spec>;

await fetchT("/users", { headers: { "x-api-key": "key" } }); // OK
await fetchT("/users", { headers: {} }); // Error: Type {} is not assignable to type '{ "x-api-key": string; }'.
```

### body

zero-fetch accepts only the body that is defined in the API specification.  
Please note that when converting an object to a string, you must use the `JSONT` type provided by typed-api-spec.

```typescript
import { JSONT } from "@notainc/typed-api-spec/json";
type Spec = DefineApiEndpoints<{
  "/users": {
    post: {
      body: { name: string };
      responses: { 200: { body: { id: string } } };
    };
  };
}>;
const fetchT = fetch as FetchT<"", Spec>;
const JSONT = JSON as JSONT;

await fetchT("/users", {
  method: "POST",
  body: JSONT.stringify({ name: "name" }),
}); // OK
await fetchT("/users", { method: "POST", body: JSONT.stringify({ name: 1 }) }); // Error: Type TypedString<{ userName: number; }> is not assignable to type TypedString<{ userName: string; }>
```

### Init

zero-fetch enforces type safety for the `init` parameter of the fetch function. The `init` parameter can be omitted only if all of the following conditions are met:

- The endpoint defines an HTTP GET method.
- All request headers defined for the endpoint are optional.

If any of these conditions are not satisfied, omitting the `init` parameter will result in a type error.

This behavior ensures that the fetch call adheres strictly to the API specification, preventing runtime errors due to missing or incorrect parameters.

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: {
      headers: { "x-api-key"?: string };
      responses: { 200: { body: { names: string[] } } };
    };
  };
  "/posts": {
    get: {
      headers: { "x-api-key": string };
      responses: { 200: { body: { posts: string[] } } };
    };
  };
}>;

const fetchT = fetch as FetchT<"", Spec>;

await fetchT("/users"); // OK, because GET method is defined and headers are optional
await fetchT("/users", { headers: { "x-api-key": "key" } }); // OK
await fetchT("/users", { headers: {} }); // OK, because headers are optional
await fetchT("/users", { method: "POST" }); // Error: POST method is not defined for this endpoint

await fetchT("/posts"); // Error: "x-api-key" header is required for this endpoint
await fetchT("/posts", { headers: { "x-api-key": "key" } }); // OK
```

```typescript
type Spec = DefineApiEndpoints<{
  "/posts": {
    post: {
      body: { title: string };
      responses: { 201: { body: { id: string } } };
    };
  };
}>;

const fetchT = fetch as FetchT<"", Spec>;

await fetchT("/posts"); // Error: GET method is not defined for this endpoint
await fetchT("/posts", {
  method: "POST",
  body: JSON.stringify({ title: "New Post" }),
}); // OK
```

## API

### FetchT

FetchT is a type that adds type information to native fetch.
First generic parameter is the origin of the API server, and the second generic parameter is the API specification.

```typescript
const fetchT = fetch as FetchT<"https://api.example.com", Spec>;
```

### JSONT

JSONT is a type that adds type information to native JSON.
If you want to check body parameter type, you need to use JSONT.stringify to convert object to string.

```typescript
import { JSONT } from "@notainc/typed-api-spec/json";
const JSONT = JSON as JSONT;
// body parameter type will be checked by using JSONT.stringify
await fetchT("/users", {
  method: "POST",
  body: JSONT.stringify({ name: "name" }),
});
```
