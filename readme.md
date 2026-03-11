# typed-api-spec monorepo

* pkgs/typed-api-spec
  * main module of the typed-api-spec package
  * It can be installed via `npm install @notainc/typed-api-spec`
* pkgs/docs
  * documentation for the typed-api-spec package
  * hosted on nota.github.io/typed-api-spec/
* examples
  * examples of using the typed-api-spec package

## Publishing

`v*.*.*` 形式のタグを push すると、GitHub Actions によって自動的に以下が実行されます。

1. `ncipollo/release-action` により GitHub Release が作成される
2. `pkgs/typed-api-spec` が npm (`@notainc/typed-api-spec`) に publish される

### 手順

```bash
# 1. バージョンを更新
npm version <patch|minor|major> -w pkgs/typed-api-spec

# 2. タグを push
git push origin main --follow-tags
```

タグが push されると、[publish.yaml](.github/workflows/publish.yaml) ワークフローが起動し、npm への公開まで自動で行われます。
