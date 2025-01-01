---
sidebar_position: 1
---

# Validation

typed-api-spec library solely provides type definitions for fetch, thus having no runtime impact (zero runtime overhead). Client-side validation is typically unnecessary if the server consistently returns responses adhering to the defined schema. However, discrepancies between the schema definition and the server's actual implementation can arise during development. To address this, typed-api-spec offers `newFetch` method designed to ensure consistency between the defined schema and the server's responses. newFetch generates a type-safe version of the fetch function. It allows you to enable or disable client-side validation via its arguments.

Think about the following scenario: you have defined the schema as follows:

```typescript
export const Spec = {
  "/repos/:owner/:repo/topics": {
    get: {
      responses: {
        // ↓:This is the actual response from server
        // 200: { body: z.object({ names: z.string().array() }) },
        
        // But we intentionally define an incorrect schema for this example
        200: { body: z.object({ noexistProps: z.string().array() }) },
        400: { body: z.object({ message: z.string() }) },
      },
    },
  },
} satisfies ZodApiEndpoints;
```

You can add type-check to the fetch function by using `fetch as FetchT<...>`

```typescript
import { ZodApiEndpoints } from "@notainc/typed-api-spec";

// added type, but no runtime validation, so you can't detect the incorrect schema definition
const fetchGitHub = fetch as FetchT<typeof GITHUB_API_ORIGIN, typeof ToApiEndpoints<ZodApiEndpoints>>;
```

But it does not provide any runtime validation.  
If you want to validate the response at runtime, you can use `newFetch` as follows:

```typescript
  const fetchGitHub = await newFetch(async () => Spec, true)<typeof GITHUB_API_ORIGIN>();
```

`newFetch` returns a type-safe `fetch` that is identical to `FetchT<typeof GITHUB_API_ORIGIN, typeof ToApiEndpoints<ZodApiEndpoints>>` above in type-level.
The difference is that if `true` is passed as the second argument, it will perform additional runtime validation.

```typescript
await fetchGitHub("/repos/notainc/typed-api-spec/topics");
// → Error: {"reason":"body","issues":[{"code":"invalid_type","expected":"array","received":"undefined","path":["noexistProps"],"message":"Required"}],"name":"ZodError"}
```

In this example we are using Zod, so of course we need to bundle zod to perform client-side validation.
However, in many cases, client-side validation is only needed during development, not in production.
So we'll rewrite the code as follows (assuming you are using Vite):

```typescript
  const fetchGitHub = newFetch(() => import("./gh.ts").then(m => m.Spec), import.meta.env.DEV)<typeof GITHUB_API_ORIGIN>();;
```

In this case, the client-side validation is only enabled in development mode, and the production build will not include the zod library.

## API

### newFetch()

newFetch() is a function that generates a type-safe fetch function with runtime validation.

```typescript
type newFetch = ( specLoader: () => Promise<Spec>, validation: boolean, ft = fetch ) => () => FetchT<Origin, Spec>;
```

- specLoader: async function that returns the API specification. If validation is false, this function is not called.
- validation: If true, client-side validation is enabled.
- ft: fetch function to be used. Default is global `fetch`.
