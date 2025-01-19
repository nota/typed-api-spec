import express from "express";
import { typed } from "@notainc/typed-api-spec/express/valibot";
import { asAsync } from "@notainc/typed-api-spec/express";
import * as v from "valibot";
import cors from "cors";
import { OpenAPIV3_1 } from "openapi-types";
import { ValibotOpenApiEndpoints } from "@notainc/typed-api-spec/valibot/openapi";
import { toOpenApiDoc } from "@notainc/typed-api-spec/valibot";

const apiEndpoints = {
  "/openapi": {
    get: {
      responses: {
        200: { body: v.any(), description: "openapi json" },
      },
    },
  },
  "/pets/:petId": {
    get: {
      summary: "Find pet by ID",
      description: "Returns a single pet",
      params: v.object({ petId: v.string() }),
      query: v.object({ page: v.string() }),
      responses: {
        200: {
          body: v.object({ name: v.string() }),
          description: "List of pets",
        },
      },
    },
  },
  "/pets": {
    post: {
      description: "Add new pet",
      body: v.object({ name: v.string() }),
      responses: {
        200: {
          body: v.object({ message: v.string() }),
          description: "Created pet",
        },
      },
    },
  },
} satisfies ValibotOpenApiEndpoints;

const openapiBaseDoc: Omit<OpenAPIV3_1.Document, "paths"> = {
  openapi: "3.1.0",
  info: { title: "title", version: "1" },
};

const newApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cors());
  const wApp = asAsync(typed(apiEndpoints, app));
  wApp.get("/openapi", (req, res) => {
    const openapi = toOpenApiDoc(openapiBaseDoc, apiEndpoints);
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
