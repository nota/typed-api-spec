import express from "express";
import * as v from "valibot";
import cors from "cors";
import { OpenAPIV3_1 } from "openapi-types";
import {
  OpenApiEndpointsSchema,
  toOpenApiDoc,
} from "@notainc/typed-api-spec/core";

const openapiBaseDoc: Omit<OpenAPIV3_1.Document, "paths"> = {
  openapi: "3.1.0",
  servers: [{ url: "http://locahost:3000" }],
  info: {
    title: "typed-api-spec OpenAPI Example",
    version: "1",
    description:
      "This is a sample Pet Store Server based on the OpenAPI 3.1 specification.",
  },
  tags: [{ name: "pets", description: "Everything about your Pets" }],
};

const apiEndpoints = {
  "/pets/:petId": {
    get: {
      summary: "Find pet by ID",
      description: "Returns a single pet",
      tags: ["pets"],
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
} satisfies OpenApiEndpointsSchema;

const newApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cors());
  // const wApp = asAsync(typed(apiEndpoints, app));
  app.get("/openapi", (req, res) => {
    const openapi = toOpenApiDoc(openapiBaseDoc, apiEndpoints);
    res.status(200).json(openapi);
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
