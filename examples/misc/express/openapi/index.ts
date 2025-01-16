import express from "express";
import { typed } from "@notainc/typed-api-spec/express/valibot";
// import { asAsync } from "@notainc/typed-api-spec/express";
import { ValibotApiEndpoints } from "@notainc/typed-api-spec/valibot";
import * as v from "valibot";
import { toOpenApi } from "@notainc/typed-api-spec/core";
import cors from "cors";

const apiEndpoints = {
  "/openapi": {
    get: {
      responses: {
        200: { body: v.any() },
      },
    },
  },
} satisfies ValibotApiEndpoints;

const newApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cors());
  const wApp = typed(apiEndpoints, app);
  wApp.get("/openapi", (req, res) => {
    const openapi = toOpenApi(
      {
        title: "Example API",
        version: "1.0.0",
      },
      {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.status(200).json(openapi as any);
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
