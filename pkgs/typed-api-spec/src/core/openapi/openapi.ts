import { OpenAPIV3_1 } from "openapi-types";

export const toOpenApi = (
  info: OpenAPIV3_1.InfoObject,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any,
  // paths: OpenAPIV3_1.PathsObject,
): OpenAPIV3_1.Document => {
  return {
    openapi: "3.1.0",
    info,
    paths: {
      "/pets": {
        get: {
          responses: {
            200: {
              description: "A list of pets.",
              content: {
                "application/json": {
                  schema,
                  // schema: {
                  //   type: "array",
                  //   items: {
                  //     type: "object",
                  //     properties: {
                  //       name: { type: "string" },
                  //       age: { type: "number" },
                  //     },
                  //   },
                  // },
                },
              },
            },
          },
        },
      },
    },
    security: [],
    servers: [],
    components: {},
  };
};
