import express from "express";
import { typed } from "@notainc/typed-api-spec/express/valibot";
import { asAsync } from "@notainc/typed-api-spec/express";
import { ValibotApiEndpoints } from "@notainc/typed-api-spec/valibot";
import * as v from "valibot";
import cors from "cors";
import { OpenAPIV3_1 } from "openapi-types";
import { toOpenApiDoc } from "@notainc/typed-api-spec";
import { toJsonSchemaApiEndpoints } from "@notainc/typed-api-spec/valibot";

const apiEndpoints = {
  "/openapi": {
    get: {
      responses: {
        200: { body: v.any() },
      },
    },
  },
  "/pets/:petId": {
    get: {
      params: v.object({ petId: v.string() }),
      query: v.object({ page: v.string() }),
      responses: {
        200: { body: v.object({ name: v.string() }) },
      },
    },
  },
  "/pets": {
    post: {
      body: v.object({ name: v.string() }),
      responses: {
        200: { body: v.object({ message: v.string() }) },
      },
    },
  },
} satisfies ValibotApiEndpoints;

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
    const openapi = toOpenApiDoc(
      openapiBaseDoc,
      toJsonSchemaApiEndpoints(apiEndpoints),
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
