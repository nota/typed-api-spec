---
sidebar_position: 0
---

# Overview

The most basic way to define an API specification in typed-api-spec is using TypeScript types.
However, you may want to perform runtime validation to check that request parameters are provided in the expected type.

The simplest way is to use only the type information provided by a validation library. For exmple, you can use [zod](https://zod.dev) to define the API specification of typed-api-spec.

```typescript
import { z } from "zod/v4";

const User = z.object({
  id: z.string(),
  name: z.string(),
});
type User = z.infer<typeof User>;

const UsersQuery = z.object({
  page: z.string(),
});

type Spec = DefineApiEndpoints<{
  "/users": {
    get: {
      query: UsersQuery;
      responses: { 200: { body: User } };
    };
  };
}>;
```

In this way, you can completely separate runtime validation and API definition, allowing you to use any validation library.
To validate, just use the validation library. Following code is an example of how to validate request parameters using zod and express.

```typescript
const app = Express();
app.get("users", (req, res) => {
  const usersQuery = UsersQuery.parse(req.query);
});
```

This is not bad, but the problem is that there is no guarantee that the UsersQuery is actually the expected schema. For example, you may accidentally write something like `User.parse(req.query)`.
(`User` is expected as a response schema, not a query.)

typed-api-spec provides a way to define the API specification using the validation library directly.

```typescript
import { z } from "zod/v4";
import { ApiEndpointsSchema } from "@notainc/typed-api-spec/core";

const Spec = {
  "/users": {
    get: {
      query: z.object({ page: z.string() }),
      responses: {
        200: { body: z.object({ id: z.string(), name: z.string() }) },
      },
    },
  },
} satisfies ApiEndpointsSchema;
```

In this way, you can use validate function directly.

```typescript
const app = Express();
app.get("users", (req, res) => {
  const usersQuery = Spec["/users"]["get"].query.parse(req.query);
});
```

:::note[Server integration]

You can make it even easier by using some server-oriented integrations such as [Express](/docs/server/express) and [Fastify](/docs/server/fastify).

```typescript
const app = express();
const wApp = typed(Spec, app);
wApp.get("users", (req, res) => {
  const { data, error } = res.locals.validate(req).query();
});
```

For more information, see [Server](/docs/category/server) page.

:::

:::note[Which validation library can I use?]

typed-api-spec supports [standard-schema](https://github.com/standard-schema/standard-schema) compatible validation libraries, like [zod](https://zod.dev), [valibot](https://valibot.dev) and [ArcType](https://arktype.io).

:::

:::note[You need validate explicitly if you want]

Even if you define API Specification with a validation library, typed-api-spec does not validate the request parameters automatically.
You need to explicitly perform validation, whether on the server side or on the client side.
:::
