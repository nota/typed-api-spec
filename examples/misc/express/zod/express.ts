import express from "express";
import { pathMap } from "../../spec/zod";
import { ToHandlers, typed } from "@notainc/typed-api-spec/express";
import { asAsync } from "@notainc/typed-api-spec/express";

const emptyMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => next();
type Handlers = ToHandlers<typeof pathMap>;
const newApp = () => {
  const app = express();
  app.use(express.json());
  // `typed` method is equivalent to below 2 lines code:
  // ```
  // // validatorMiddleware allows to use res.locals.validate method
  // app.use(validatorMiddleware(pathMap));
  // // wApp is same as app, but with additional core information
  // const wApp = app as TRouter<typeof pathMap>;
  // ```
  const wApp = asAsync(typed(pathMap, app));
  wApp.get("/users", emptyMiddleware, async (req, res) => {
    // eslint-disable-next-line no-constant-condition
    if (false) {
      // @ts-expect-error params is not defined because pathMap["/users"]["get"].params is not defined
      res.locals.validate(req).params();
    }

    // validate method is available in res.locals
    // validate(req).query() is equals to pathMap["/users"]["get"].query.safeParse(req.query)
    const r = await res.locals.validate(req).query();
    if (r.issues) {
      // res.status(400).json() accepts only the response schema defined in pathMap["/users"]["get"].res["400"]
      return res.status(400).json({ errorMessage: r.issues.toString() });
    }
    // res.status(200).json() accepts only the response schema defined in pathMap["/users"]["get"].res["200"]
    return res.status(200).json({ userNames: [`page${r.value.page}#user1`] });
  });

  wApp.post("/users", async (req, res) => {
    {
      // Request header also can be validated
      res.locals.validate(req).headers();
    }

    // validate(req).body() is equals to pathMap["/users"]["post"].body.safeParse(req.body)
    const r = await res.locals.validate(req).body();
    if (r.issues) {
      // res.status(400).json() accepts only the response schema defined in pathMap["/users"]["post"].res["400"]
      return res.status(400).json({ errorMessage: r.issues.toString() });
    }
    // res.status(200).json() accepts only the response schema defined in pathMap["/users"]["post"].res["200"]
    return res.status(200).json({ userId: r.value.userName + "#0" });
  });

  const getUserHandler: Handlers["/users/:userId"]["get"] = async (
    req,
    res,
  ) => {
    const r = await res.locals.validate(req).params();
    if (r.issues) {
      // res.status(400).json() accepts only the response schema defined in pathMap["/users/:userId"]["get"].res["400"]
      return res.status(400).json({ errorMessage: r.issues.toString() });
    }
    // res.status(200).json() accepts only the response schema defined in pathMap["/users/:userId"]["get"].res["200"]
    return res.status(200).json({ userName: "user#" + r.value.userId });
  };
  wApp.get("/users/:userId", getUserHandler);

  return app;
};

const main = async () => {
  const app = newApp();
  const port = 3000;
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

main();
