# typed-api-spec + Swagger UI (React + Vite)

typed-api-spec で書いた API 定義から自動生成した OpenAPI ドキュメントを、ブラウザで Swagger UI として表示するデモ。

## デモの内容

このアプリ自体は 10 行程度の React で、`swagger-ui-react` に `http://localhost:3000/openapi` を渡してるだけ。
「同エンドポイントに OpenAPI JSON を配信するサーバー」と **ペアで動かす** 前提の構成。

```
[examples/misc の Express server]              [このアプリ]
localhost:3000/openapi ─── OpenAPI JSON ──▶ localhost:5173 (Swagger UI)
```

## 起動方法

2 プロセス必要。repo のルートから:

**1. サーバー側**（OpenAPI 配信の Express アプリを起動）
```bash
npm run ex:express:zod:openapi -w examples/misc
# → localhost:3000 で立つ
```

**2. Swagger UI 側**
```bash
# typed-api-spec 本体をビルド
npm run build -w pkgs/typed-api-spec

# dev server 起動
npm run dev -w examples/vite-react-openapi
# → localhost:5173 で立つ
```

ブラウザで `http://localhost:5173/` を開くと、typed-api-spec 生成の OpenAPI 仕様に基づく Swagger UI が表示される。

## 見どころ

- サーバー側（[examples/misc/express/zod/openapi/index.ts](../misc/express/zod/openapi/index.ts)）は typed-api-spec の spec を書いて `toOpenApiDoc` で OpenAPI JSON に変換 → `/openapi` で serve するだけ
- 「型定義から OpenAPI ドキュメントを一次情報として自動生成できる」ことが売り
- Valibot 版に切り替える場合は `npm run ex:express:valibot:openapi -w examples/misc` に差し替え
