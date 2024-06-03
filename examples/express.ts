import express from "express";
import { asAsync, typed } from "../src";
import { pathMap } from "./spec";

const newApp = () => {
  const app = express();
  app.use(express.json());
  // `typed` method is equivalent to below 2 lines code:
  // ```
  // // validatorMiddleware allows to use res.locals.validate method
  // app.use(validatorMiddleware(pathMap));
  // // wApp is same as app, but with additional type information
  // const wApp = app as TRouter<typeof pathMap>;
  // ```
  const wApp = asAsync(typed(pathMap, app));
  wApp.get("/users", (req, res) => {
    {
      // @ts-expect-error params is not defined because pathMap["/users"]["get"].params is not defined
      res.locals.validate(req).params();
    }

    // validate method is available in res.locals
    // validate(req).query() is equals to pathMap["/users"]["get"].query.safeParse(req.query)
    const r = res.locals.validate(req).query();
    if (r.success) {
      // res.status(200).json() accepts only the response schema defined in pathMap["/users"]["get"].res["200"]
      res.status(200).json({ userNames: [`page${r.data.page}#user1`] });
    } else {
      // res.status(400).json() accepts only the response schema defined in pathMap["/users"]["get"].res["400"]
      res.status(400).json({ errorMessage: r.error.toString() });
    }
  });
  wApp.post("/users", (req, res) => {
    // validate(req).body() is equals to pathMap["/users"]["post"].body.safeParse(req.body)
    const r = res.locals.validate(req).body();
    if (r.success) {
      // res.status(200).json() accepts only the response schema defined in pathMap["/users"]["post"].res["200"]
      res.status(200).json({ userId: r.data.userName + "#0" });
    } else {
      // res.status(400).json() accepts only the response schema defined in pathMap["/users"]["post"].res["400"]
      res.status(400).json({ errorMessage: r.error.toString() });
    }
  });
  wApp.get("/users/:userId", (req, res) => {
    const params = res.locals.validate(req).params();

    if (params.success) {
      // res.status(200).json() accepts only the response schema defined in pathMap["/users/:userId"]["get"].res["200"]
      res.status(200).json({ userName: "user#" + params.data.userId });
    } else {
      // res.status(400).json() accepts only the response schema defined in pathMap["/users/:userId"]["get"].res["400"]
      res.status(400).json({ errorMessage: params.error.toString() });
    }
  });
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
