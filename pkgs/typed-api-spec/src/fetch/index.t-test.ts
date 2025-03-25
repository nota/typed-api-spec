import {
  AsJsonApi,
  DefineApiEndpoints,
  ExcessiveQueryError,
  MissingQueryError,
  ToApiEndpoints,
} from "../core";
import FetchT, { ValidateUrl } from "./index";
import JSONT from "../json";
import { Equal, Expect } from "../core/type-test";
import { C } from "../compile-error-utils";
import { ApiEndpointsSchema } from "../../dist";
import z from "zod";
const JSONT = JSON as JSONT;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ValidateUrlTestCase = [
  Expect<Equal<ValidateUrl<{ a: string }, `/topics?a=b`>, C.OK>>,
  Expect<
    Equal<ValidateUrl<{ a: string }, `https://api.github.com/topics?a=b`>, C.OK>
  >,
  Expect<
    Equal<
      ValidateUrl<{ a: string }, `/repos/nota/typed-api-spec/topics`>,
      C.E<"query parameter required">
    >
  >,
  Expect<
    Equal<
      ValidateUrl<{ state: string }, "https://example.com?a=1">,
      MissingQueryError<"state"> | ExcessiveQueryError<"a">
    >
  >,
];

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        responses: {
          200: {
            body: { prop: string };
            headers: { "Content-Type": "application/json" };
          };
        };
      };
    };
  }>;
  (async () => {
    const f = fetch as FetchT<"", Spec>;
    {
      // @ts-expect-error 今はinitの省略ができないが、できるようにしたい
      await f("/users");

      // methodを省略した場合はgetとして扱う
      const res = await f("/users", {});
      (await res.json()).prop;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const contentType: "application/json" = res.headers.get("Content-Type");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const hasContentType: true = res.headers.has("Content-Type");
    }
  })();
}
{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        responses: { 200: { body: { prop: string } } };
      };
      post: {
        body: {
          userName: string;
        };
        responses: {
          200: { body: { postProp: string } };
          400: { body: { error: string } };
        };
      };
    };
  }>;
  type JsonSpec = AsJsonApi<Spec>;
  (async () => {
    const f = fetch as FetchT<"", JsonSpec>;
    const f2 = fetch as FetchT<"", Spec>;
    const JSONT = JSON as JSONT;
    {
      // @ts-expect-error fetch requires input
      f();
    }

    {
      const res = await f("/users", {
        method: "get",
        headers: { "Content-Type": "application/json" },
      });
      // Specで定義したプロパティにアクセスできる
      (await res.json()).prop;
    }

    {
      // methodを省略した場合はgetとして扱う
      const res = await f("/users", {
        headers: { "Content-Type": "application/json" },
      });
      (await res.json()).prop;
    }

    {
      // methodを省略した場合はgetとして扱う
      const res = await f("/users", {
        headers: { "Content-Type": "application/json" },
      });
      res.headers;
      // Specで定義したプロパティにアクセスできる
      (await res.json()).prop;
    }

    {
      // @ts-expect-error API定義と異なるheadersを指定した場合は型エラー
      await f("/users", { headers: {} });
    }

    {
      // @ts-expect-error queryが定義されていないSpecに対してクエリパラメータを指定した場合は型エラー
      await f("/users?a=1", {
        headers: { "Content-Type": "application/json" },
      });
    }

    {
      // AsJsonApiを利用していない場合、Content-Typeがapplication/jsonでなくてもエラーにならない
      await f2("/users", {});
    }

    {
      const res = await f("/users", {
        method: "post",
        body: JSONT.stringify({
          userName: "user",
          // TODO: 余剰プロパティチェックを今は受け付けてしまうがなんとかしたい
          unknownProp: "a",
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        (await res.json()).postProp;
      } else {
        (await res.json()).error;
      }
    }

    {
      // @ts-expect-error 定義されていないmethodは指定できない
      await f("/users", { method: "patch" });
    }
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        headers: { Cookie: `a=${string}` };
        responses: { 200: { body: { prop: string } } };
      };
    };
  }>;
  (async () => {
    const basePath = "https://example.com/api";
    const f = fetch as FetchT<typeof basePath, Spec>;
    await f(`${basePath}/users`, {
      headers: { Cookie: "a=b" },
    });
  })();

  (async () => {
    // basePathの最後にも/があるのでhttps://example.com/api//usersとなってしまうが、ノーマライズされるので問題ない
    const basePath = "https://example.com/api/";
    const f = fetch as FetchT<typeof basePath, Spec>;
    await f(`${basePath}/users`, {
      headers: { Cookie: "a=b" },
    });
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      post: { responses: { 200: { body: { prop: string } } } };
    };
  }>;
  (async () => {
    const f = fetch as FetchT<"", Spec>;
    // @ts-expect-error getが定義されていない場合、methodは省略できない
    await f(`/users`, {});
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      post: {
        headers: { "Content-Type"?: "application/json" };
        body: { userName?: string };
        responses: { 200: { body: { prop: string } } };
      };
    };
  }>;
  (async () => {
    const f = fetch as FetchT<"", Spec>;
    // headers and body can be omitted because they are optional
    await f(`/users`, { method: "post" });
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      post: {
        body: string;
        responses: { 200: { body: string } };
      };
    };
  }>;
  (async () => {
    const f = fetch as FetchT<"", Spec>;
    await f(`/users`, { method: "post", body: "some string" });
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/packages/list": {
      get: {
        headers: { Cookie: `a=${string}` };
        responses: { 200: { body: { prop: string } } };
        query: {
          state: string;
        };
      };
    };
  }>;
  (async () => {
    const basePath = "/api/projects/:projectName/workflow";
    const f = fetch as FetchT<typeof basePath, Spec>;
    {
      const res = await f(
        `/api/projects/projectA/workflow/packages/list?state=true`,
        {
          headers: { Cookie: "a=b" },
        },
      );
      if (res.ok) {
        (await res.json()).prop;
      }
    }
    {
      // @ts-expect-error queryが定義されているSpecに対してクエリパラメータを指定しなかった場合は型エラー
      f(`/api/projects/projectA/workflow/packages/list`, {
        headers: { Cookie: "a=b" },
      });
    }
    {
      // @ts-expect-error 定義されているパラメータを指定していない場合はエラー
      f(`/api/projects/projectA/workflow/packages/list?a=b`, {
        headers: { Cookie: "a=b" },
      });
    }
    {
      // @ts-expect-error 定義されていないパラメータを指定した場合は型エラー
      f(`/api/projects/projectA/workflow/packages/list?state=true&a=b`, {
        headers: { Cookie: "a=b" },
      });

      // @ts-expect-error 順序は関係ない
      f(`/api/projects/projectA/workflow/packages/list?a=b&state=true`, {
        headers: { Cookie: "a=b" },
      });
    }
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/packages/list": {
      get: {
        responses: { 200: { body: { prop: string } } };
        query: { state?: boolean };
      };
    };
  }>;
  (async () => {
    const basePath = "/api/projects/:projectName/workflow";
    const f = fetch as FetchT<typeof basePath, Spec>;
    {
      const res = await f(
        `/api/projects/projectA/workflow/packages/list?state=true`,
        {},
      );
      if (res.ok) {
        (await res.json()).prop;
      }
    }
    {
      // query parameter can be omitted because it is optional
      f(`/api/projects/projectA/workflow/packages/list`, {});
    }
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/vectorize/indexes/:indexName": {
      post: {
        responses: { 200: { body: { prop2: string } } };
      };
    };
    "/vectorize/indexes/:indexName/get-by-ids": {
      post: {
        body: { ids: string[] };
        responses: { 200: { body: { prop: string } } };
      };
    };
  }>;
  (async () => {
    const CLOUDFLARE_API_HOST = "https://api.cloudflare.com/client/v4";
    const getCloudflareAccountEndpoint = (accountId: string) =>
      `${CLOUDFLARE_API_HOST}/accounts/${accountId}` as const;
    const basePath = getCloudflareAccountEndpoint("accountId");
    const f = fetch as FetchT<typeof basePath, Spec>;
    {
      const res = await f(`${basePath}/vectorize/indexes/indexA/get-by-ids`, {
        method: "POST",
        body: JSONT.stringify({ ids: ["1", "2", "3"] }),
      });
      if (res.ok) {
        (await res.json()).prop;
      }
    }
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/": {
      get: {
        responses: { 200: { body: { userId: string } } };
      };
    };
    "/:org": {
      get: {
        responses: { 200: { body: { org: string } } };
      };
    };
  }>;
  (async () => {
    const f = fetch as FetchT<"", Spec>;
    {
      // If path variable is empty, it should not be matched
      // For example, "/" should not match to "/:org"
      const res = await f("/", {});
      (await res.json()).userId;
    }
  })();
}

{
  const ResBody = z.object({ userId: z.string().brand("UserId") });
  type ResBody = z.infer<typeof ResBody>;
  const spec = {
    "/": {
      get: {
        responses: { 200: { body: ResBody } },
      },
    },
  } satisfies ApiEndpointsSchema;
  (async () => {
    const f = fetch as FetchT<"", ToApiEndpoints<typeof spec>>;
    {
      const res = await f("/", {});

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _body: ResBody = await res.json();
    }
  })();
}
