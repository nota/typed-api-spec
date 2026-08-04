# typed-api-spec + Swagger UI (React + Vite)

`swagger-ui-react` で `http://localhost:3000/openapi` を表示する。同エンドポイントを配信するサーバー ([examples/misc/express/zod/openapi/index.ts](../misc/express/zod/openapi/index.ts)) と組で動く。

## 起動方法

repo のルートから 2 プロセス起動。

サーバー側:
```bash
npm run ex:express:zod:openapi -w examples/misc
# localhost:3000
```

Swagger UI 側:
```bash
npm run build -w pkgs/typed-api-spec
npm run dev -w examples/vite-react-openapi
# localhost:5173
```
