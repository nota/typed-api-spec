# Express

Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.

typed-api-spec provides first-class support for Express.
You can apply types to your Express app using the `typed()`.

Here is an example of how to use `express` with `typed-api-spec` and `zod`.

```typescript
const app = express();
app.use(express.json());
const wApp = typed(pathMap, app);
wApp.get("/users", (req, res) => {
  // validate method is available in res.locals
  // validate(req).query() is equals to pathMap["/users"]["get"].query["~standard"].validate(req.query)
  const query = res.locals.validate(req).query();
  if (query.issues) {
    // res.status(400).json() accepts only the response schema defined in pathMap["/users"]["get"]["responses"]["400"]["body"]
    return res.status(400).json({ errorMessage: query.issues.toString() });
  }
  // res.status(200).json() accepts only the response schema defined in pathMap["/users"]["get"]["responses"]["200"]["body"]
  return res.status(200).json({ userNames: [`page${query.data.page}#user1`] });
});

newApp().listen(3000, () => {
  console.log(`Example app listening on port ${port}`);
});
```

## API

### typed()

typed() is a function that applies more strict types to the Express app.
It returns an Express app same as the input app, but validate method has been added to the request locals.

Note that the validate method is depended on validation library you use.
Following example uses zod.

```typescript
import { ApiEndpointsSchema } from "@notainc/typed-api-spec/core";
import { typed } from "@notainc/typed-api-spec/express";
import { z } from "zod";

const Spec = {
  "/users": {
    get: {
      query: z.object({ page: z.string() }),
      responses: { 200: { body: z.object({ userNames: z.string().array() }) } },
    },
  },
} satisfies ApiEndpointsSchema;

const wApp = typed(pathMap, app);
wApp.get("users", (req, res) => {
  // validate method is available in res.locals because of typed()
  const { data, error } = res.locals.validate(req).query();
});
```

### validate()

validate() is a method that is added to the request locals by typed().
It returns a function that validates the request parameters and returns the result.
Available methods are `query()`, `params()`, `headers()`, and `body()`.

### asAsync()

asAsync() is a function that wraps the express app to handle errors of async handlers.
If error is thrown in async handler of wrapped app, it will be caught and passed to the error handler.

:::note

The reason why we provide this function is that Express4 or lower does not properly handle async errors.
The upcoming Express5 release will support async error handling, making this method unnecessary.

:::

## Playground

<iframe style={{width: "100%", height: '85svh'}} src="https://stackblitz.com/edit/vitejs-vite-7x2cnq?embed=1&file=src%2Fexamples%2Fexpress.ts&hideExplorer=1&hideNavigation=1"></iframe>
