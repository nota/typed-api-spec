import express from "express";
import cors from "cors";
import { OpenAPIV3_1 } from "openapi-types";
import "zod-openapi/extend";
import z from "zod";
import { SSOpenApiEndpoints, toOpenApiDoc } from "@notainc/typed-api-spec/core";

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
      params: z.object({
        petId: z.string().openapi({ description: "ID of pet", example: "1" }),
      }),
      query: z.object({ page: z.string() }),
      responses: {
        200: {
          body: z.object({ name: z.string() }),
          description: "List of pets",
        },
      },
    },
  },
  "/pets": {
    post: {
      description: "Add new pet",
      body: z.object({ name: z.string() }),
      responses: {
        200: {
          body: z.object({ message: z.string() }),
          description: "Created pet",
        },
      },
    },
  },
} satisfies SSOpenApiEndpoints;

const newApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cors());
  // const wApp = asAsync(typed(apiEndpoints, app));
  app.get("/openapi", async (req, res) => {
    const openapi = await toOpenApiDoc(openapiBaseDoc, apiEndpoints);
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
