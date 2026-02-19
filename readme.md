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

### GitHub Packages

GitHub Actions の `workflow_dispatch` により手動で GitHub Packages に publish できます。実行にはCollaborator以上の権限が必要です。

1. リポジトリの **Actions** タブを開く
2. **"Publish Package to GitHub Packages"** ワークフローを選択
3. **"Run workflow"** をクリックし、必要に応じてバージョンを入力して実行