# Fastify

Fastify is a web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture.

Here is an example of how to use `fastify` with `typed-api-spec` and `zod`.

```typescript
const fastify = Fastify({ logger: true });

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
const server = fastify.withTypeProvider<ZodTypeProvider>();

const routes = toRoutes(pathMap);

server.route({
  ...routes["/users"]["get"],
  handler: async (request, reply) => {
    const page = request.query.page;
    return { userNames: [`page${page}#user1`] };
  },
});

await fastify.listen({ port: 3000 });
```

## API

### toRoutes()

toRoutes() is a function that converts the API specification schema to Fastify route object.

```typescript
const Spec = {
  "/users": {
    get: {
      query: z.object({ page: z.string() }),
      responses: { 200: { body: z.object({ userNames: z.string().array() }) } },
    },
  },
} satisfies ApiEndpointsSchema;

const routes = toRoutes(Spec);
console.log(routes["/users"]["get"]);
/* =>
{
  method: 'GET',
  url: '/users',
  schema: {
    query: z.object({ page: { type: 'string' } }),
    response: {
      200: { z.object({ userNames: z.string().array() } }
    }
  }
}
*/
```
