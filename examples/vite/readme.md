# typed-api-spec + Vite (vanilla TS)

Vite でバンドルしたブラウザから typed-api-spec を使う最小サンプル。React 版は [`examples/vite-react-openapi`](../vite-react-openapi) を参照。

## デモの内容

GitHub 公式 API `GET /repos/{owner}/{repo}/topics` を叩き、typed-api-spec の **実行時 spec 検証**（`withValidation`）を dev 時のみ有効化する挙動を見せる。

- **Fetch from GitHub**: spec が実際のレスポンスと一致 → 正常に topics を表示
- **Invalid fetch from GitHub**: わざと壊した spec (`{ noexistProps: string[] }`) で validation → `SpecValidatorError` を throw

## 起動方法

repo のルートから:

```bash
# typed-api-spec 本体をビルド（examples が dist を参照するため）
npm run build -w pkgs/typed-api-spec

# dev server 起動（デフォルト http://localhost:5173）
npm run dev -w examples/vite
```

typed-api-spec 側のコードを弄ったら再度 `npm run build -w pkgs/typed-api-spec` するか、`npm run watch:build -w pkgs/typed-api-spec` を別ターミナルで常駐させる。

## 見どころ

- [src/main.ts](src/main.ts): `withValidation` の on/off を `import.meta.env.DEV` で切り替え。production build では validation コードごと dead-code elimination される
- [src/github/spec.ts](src/github/spec.ts): `ApiEndpointsSchema` を satisfies した最小 spec の書き方
