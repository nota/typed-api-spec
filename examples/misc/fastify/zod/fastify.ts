// Import the framework and instantiate it
import Fastify, { FastifyError } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { pathMap } from "../../spec/zod";
import { toRoutes } from "@notainc/typed-api-spec/fastify/zod";
import { ZodError } from "zod";
const fastify = Fastify({ logger: true });

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
const server = fastify.withTypeProvider<ZodTypeProvider>();
server.setErrorHandler<ZodError | FastifyError>((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .type("application/json")
      .send({ errorMessage: JSON.stringify(error.issues) });
  }
  return reply
    .status(error.statusCode ?? 500)
    .type("application/json")
    .send({ errorMessage: error.message });
});
const routes = toRoutes(pathMap);

// Define by using route object
server.route({
  ...routes["/users"]["get"],
  handler: async (request, reply) => {
    const page = request.query.page;
    if (Number.isNaN(Number(page))) {
      return reply.status(400).send({ errorMessage: "page is not a number" });
    }
    return { userNames: [`page${page}#user1`] };
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _noExecution = () => {
  // Or you can also define by using RouteShorthandMethod
  server.get(
    "/users",
    {
      schema: routes["/users"]["get"]["schema"],
    },
    async (request) => {
      {
        // @ts-expect-error noexist is not defined in pathMap["/users"]["get"]
        request.query.noexist;
      }
      const page = request.query.page;
      return { userNames: [`page${page}#user1`] };
    },
  );
};

server.route({
  ...routes["/users"]["post"],
  handler: async (request, reply) => {
    const userName = request.body.userName;
    return reply
      .header("Content-Type", "application/json")
      .send({ userId: userName + "#0" });
  },
});

server.route({
  ...routes["/users/:userId"]["get"],
  handler: async (request) => {
    const userId = request.params.userId;
    return { userName: `user#${userId}` };
  },
});

(async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
