# ESLint → Oxlint 移行

## Context

このリポジトリは既にフォーマッタを oxfmt に移行済み（[.oxfmtrc.json](.oxfmtrc.json)）だが、lint は ESLint のままになっている。
ESLint を Oxlint に置き換え、lint の実行速度と依存の軽さを改善する。

このリポジトリの前提:

- カスタム ESLint ルール／プラグインは無いため、ルール本体の移植や RuleTester の移行は不要
- 現状の設定は型情報を使わない `tseslint.configs.recommended` のみ → 今回は type-aware（`oxlint-tsgolint`）を入れず、挙動の等価性を優先する（必要なら後続 PR で追加）

対象は eslint 設定を持つ 3 ワークスペース:

| ワークスペース | 現在の設定 | lint script |
| --- | --- | --- |
| [pkgs/typed-api-spec](pkgs/typed-api-spec/) | js+ts recommended / strict-dependencies / no-unused-vars カスタム / `*.t-test.ts` override | `test:lint` |
| [examples/misc](examples/misc/) | js+ts recommended のみ | `test:lint` |
| [examples/vite-react-openapi](examples/vite-react-openapi/) | js+ts recommended / react-hooks / react-refresh / globals.browser | `lint` |

`pkgs/docs`・`examples/vite` は eslint 設定を持たないため対象外。

## 方針

- 設定ファイル形式は `.oxlintrc.json`（`@oxlint/migrate` のデフォルト出力）
- 設定は現状どおりワークスペースごとに配置（ルート集約はしない）。各ワークスペースが単独で lint 可能な現構成を維持する
- `oxlint` も現状の eslint と同様、ワークスペースごとに devDependency として入れる
- 変換は `@oxlint/migrate` で機械的に行い、その結果を人間がレビューして手直しする

## 手順

### 1. 移行前に eslint の実効設定をダンプ（最初にやること）

検証 §A で使う「正解」の設定。eslint を削除する手順 4 の後では取得できないため、必ず最初に取る。
`eslint --print-config` はファイル単位で設定を解決するので、override の効き方が違う代表ファイルごとに取得する。

```
npx eslint --print-config <file> > $SCRATCH/eslint-config-<name>.json
```

対象ファイル:

- `pkgs/typed-api-spec/src/index.ts`（通常）
- `pkgs/typed-api-spec` 配下の `*.t-test.ts` 1 つ（override が効く側）
- `examples/misc` の `.ts` 1 つ
- `examples/vite-react-openapi/src/App.tsx`

あわせて lint 対象ファイルの一覧も取得する（検証 §B で使う）。

```
npx eslint . --format json | jq -r '.[].filePath' | sort > $SCRATCH/eslint-files-<pkg>.txt
```

なお lint 違反そのもののベースラインは取らない。main は CI が通っており違反 0 件のため、差分の基準にならない。

### 2. `@oxlint/migrate` で自動変換

各ディレクトリで実行し `.oxlintrc.json` を生成する。`--details` で移行できなかったルールを確認する。

```
npx @oxlint/migrate --details
```

外部 eslint プラグインはデフォルトで `jsPlugins` として移行される（`--js-plugins` 既定 ON）。

### 3. 生成された設定のレビュー・手直し

各パッケージで以下が正しく移行されているか確認し、漏れは手で補う。

- pkgs/typed-api-spec
  - `strict-dependencies/strict-dependencies` が `jsPlugins` 経由で残り、`depRules`（5 モジュール分の allowReferenceFrom）と `resolveRelativeImport: true` が JSON に展開されていること
  - `no-unused-vars` の `varsIgnorePattern: "^_"` / `argsIgnorePattern: "^_"` / `caughtErrors: "none"` が保持されていること
  - `**/*.t-test.ts` の override（`no-unused-vars` / `no-unused-expressions` を off）が残っていること
  - `ignores` の `**/dist/*`・`docs/**/*` が `ignorePatterns` に移っていること（`eslint.config.js` 自体は削除するので不要）
- examples/misc — js+ts recommended 相当のみ。特記事項なし
- examples/vite-react-openapi
  - react-hooks は oxlint がネイティブ実装を持つため、ネイティブルール（`react/exhaustive-deps`・`react/rules-of-hooks` 相当）に寄せる。ネイティブで賄えれば `eslint-plugin-react-hooks` の依存は落とす
  - `.oxlintrc.json` には `react/static-components`・`react/use-memo`・`react/preserve-manual-memoization`・`react/incompatible-library`・`react/immutability`・`react/globals`・`react/refs`・`react/set-state-in-effect`・`react/error-boundaries`・`react/purity`・`react/set-state-in-render`・`react/unsupported-syntax` の計 12 ルールも生成される。これは oxlint 独自ルールの新規追加ではなく、`eslint-plugin-react-hooks`（v5 以降）の `recommended` 設定が React Compiler 関連ルールをバンドルしているために元々 eslint 側で有効だったもの（`reactHooks.configs.recommended.rules` 由来）。スコープ外節の「oxlint 独自ルールの新規有効化はしない」には抵触しないため、意図的にそのまま維持する
  - `react-refresh/only-export-components` は oxlint にネイティブ実装が無いため `jsPlugins` として維持（`eslint-plugin-react-refresh` の依存は残す）
  - `globals.browser` → `env: { browser: true }` に変換されること（変換されれば `globals` 依存は削除）

カテゴリ差の担保: oxlint はデフォルトでは `correctness` カテゴリしか有効にしない（具体的なルール数はバージョンで変わるため固定値では記載せず、移行時点の `npx oxlint --print-config .`（設定ファイル無しで実行し、既定の有効ルールを実測する）で都度確認する）。ESLint の recommended に入っていたルールでも oxlint 側で別カテゴリなら既定 OFF になるため、明示的に有効化する。

| ルール | oxlint のカテゴリ | 既定 |
| --- | --- | --- |
| `typescript/no-explicit-any` | restriction | OFF |
| `typescript/no-empty-object-type` | restriction | OFF |
| `typescript/no-namespace` | restriction | OFF |
| `typescript/no-unsafe-function-type` | pedantic | OFF |
| `no-unused-vars` / `no-constant-condition` | correctness | ON |

既存の `eslint-disable` コメント 84 箇所のうち 67 箇所が上記の既定 OFF 側のルール宛てで、有効化を忘れると lint が実質的に緩くなる。`@oxlint/migrate` はルールを個別に書き出すため基本は自動で担保されるが、手順 1 のダンプと突き合わせて取りこぼしがないことを確認する（検証 §A）。

`plugins` を明示指定して既定より狭めていないかも確認する。oxlint は `plugins` を省略すると `unicorn` / `typescript` / `oxc` が既定で有効になるため、`@oxlint/migrate` が `plugins` を明示的に書き出すとこれらが外れて既定より緩くなりうる。

既知の移行不可ルール: `@oxlint/migrate --details` の Unsupported 出力および検証 §A で確認済みの、oxlint に実装が無く移行できないルール。手直しでの復活は不可能なので、PR の説明に明記して残す。

| ルール | 対象ワークスペース | 理由 |
| --- | --- | --- |
| `no-octal` | 全 3 ワークスペース | oxlint 未実装。`@oxlint/migrate --details` が Unsupported（strict mode下では8進数リテラルは構文エラーになるため実害は低い）として報告 |
| `react-hooks/config` | examples/vite-react-openapi | oxlint の `react` プラグインに対応ルールが無い（React Compiler の固定オプションのため設定検証自体が不要という oxlint 側の判断） |
| `react-hooks/gating` | examples/vite-react-openapi | 同上（React Compiler の gating オプションを oxlint は公開していない） |

### 4. eslint 関連ファイル・依存の削除

- 削除するファイル: [pkgs/typed-api-spec/eslint.config.js](pkgs/typed-api-spec/eslint.config.js)、[examples/misc/eslint.config.js](examples/misc/eslint.config.js)、[examples/vite-react-openapi/eslint.config.js](examples/vite-react-openapi/eslint.config.js)
- 各 `package.json` の devDependencies から削除: `eslint`・`@eslint/js`・`typescript-eslint`（+ vite-react-openapi の `globals`、examples/misc で未使用の `eslint-plugin-strict-dependencies`）
- 残す: `eslint-plugin-strict-dependencies`（typed-api-spec、jsPlugin として使用）、`eslint-plugin-react-refresh`（jsPlugin として使用）
- 追加: `oxlint`（^1.82.0）を 3 パッケージそれぞれに devDependency として追加

### 5. npm scripts の更新

- [pkgs/typed-api-spec/package.json](pkgs/typed-api-spec/package.json): `"test:lint": "eslint ."` → `"oxlint ."`
- [examples/misc/package.json](examples/misc/package.json): `"test:lint": "eslint ."` → `"oxlint ."`
- [examples/vite-react-openapi/package.json](examples/vite-react-openapi/package.json): `"lint": "eslint ."` → `"oxlint ."`

CI（[.github/workflows/all.yaml](.github/workflows/all.yaml)）は lint を直接呼ばず `npm test` 経由で実行しているため、ワークフローの変更は不要。

### 6. `npm install` で package-lock.json を更新

CI は `npm ci` を使うため lockfile の更新が必須。

### 7. lint を通し、テストが全て緑になることを確認する

1. 各ディレクトリで `npx oxlint .` を実行し、新たに出た違反はこの PR 内で直す（ルール OFF による先送りはしない）。一括修正が現実的でない規模（数百件など）になった場合は、その時点で件数とルールを報告して判断を仰ぐ
2. 出力される対象ファイル数・適用ルール数を記録する（ルール数は取りこぼしの粗い検知指標になる）
3. `npm test -w pkgs/typed-api-spec` / `npm test -w examples/misc`（`test:lint`・`test:format`・`test:type-check`・`test:unit`）と `npm run lint -w examples/vite-react-openapi` が通ること
4. lockfile が更新され `npm ci` が通ること

`eslint-disable-next-line @typescript-eslint/...` 形式のコメント 84 箇所は、oxlint が旧 eslint 名を読み替えるため原則そのままで良い。読み替えに失敗していれば `no-explicit-any` の 59 箇所が違反として出るので、1 のエラー 0 件で同時に確認できる。

## 検証

手順 7 の「エラーが出ないこと」だけでは、ルールが落ちて検査が静かに緩くなったケースを検出できない。lint の効き方そのものを A〜D で担保する。A が主たる担保。

### A. 有効ルール集合の静的な突き合わせ（主たる担保）

`oxlint --print-config` は jsPlugin（`eslint-plugin-strict-dependencies` など）が提供するルールを出力に含めないため、jsPlugin 分のルールはこの比較では判定できない。そのため oxlint 側は `--print-config` ではなく `.oxlintrc.json` 自体（トップレベル `rules` と `overrides[].rules`）を直接読んで静的に比較し、jsPlugin ルールが実際にロード・発火することは検証 §C の実行プローブでのみ担保する。

1. 手順 1 で取得した eslint 側のダンプ（`--print-config`、ファイル単位）を「正解」として使う
2. 移行後の `.oxlintrc.json` を読み、比較対象ファイルごとに実効ルール集合を静的に計算する
   - トップレベル `rules` から severity が `off` でないものを抽出
   - `overrides` を順に走査し、`files` の glob が対象ファイルにマッチする override があれば同名ルールを上書き（後勝ち、`{ts,tsx}` のようなブレース展開も含めて glob 解決する）
   - `categories`/`plugins` による既定有効化はここでは考慮しない（既定 OFF にした上で `rules` に明示列挙する運用のため。既定有効化に依存している箇所が無いかは手順 3 で別途確認する）
   - jsPlugin（`jsPlugins` に列挙されたパッケージ）が提供するルールはこの静的比較の対象外とする
3. scratchpad の使い捨てスクリプトで集合比較する
   - eslint 側: `rules` のうち severity が `off`/`0` でないルール名を抽出
   - 名前を正規化する。基本は `@typescript-eslint/foo` → `typescript/foo`、`react-hooks/foo` → `react/foo`、`react-refresh/only-export-components` → `react/only-export-components`
   - ただし以下のルールは ESLint コア版と `@typescript-eslint` 版が oxlint 側で無接頭辞の 1 ルールに統合される（`typescript/foo` ではなく `foo`）。単純な接頭辞置換では偽陽性（移行漏れの誤検知）になるため個別対応する: `class-methods-use-this` / `default-param-last` / `init-declarations` / `max-params` / `no-array-constructor` / `no-dupe-class-members` / `no-empty-function` / `no-invalid-this` / `no-loop-func` / `no-loss-of-precision` / `no-magic-numbers` / `no-redeclare` / `no-restricted-imports` / `no-shadow` / `no-unused-expressions` / `no-unused-vars` / `no-use-before-define` / `no-useless-constructor`（`no-unused-vars`・`no-unused-expressions` は `pkgs/typed-api-spec` の options・override 込みで実機確認済み）
   - 上記リスト以外で差分が出た場合も、oxlint 側に無接頭辞の同名ルールが無いか確認してから「移行不可」と判断する（未知の統合パターンに対するフォールバック）
   - oxlint 側の実効ルール集合との差集合を出す
4. 差分に出たルールを 1 件ずつ判断する
   - カテゴリ違いで既定 OFF になっていただけ → `.oxlintrc.json` で明示的に有効化
   - oxlint に未実装 → 移行不可として一覧化し、PR の説明に残す
   - severity や options（`varsIgnorePattern` など）の差も同様に確認する
   - jsPlugin ルール（`strict-dependencies/strict-dependencies` など）はこの比較では「対象外」として扱い、有効化されていること自体は検証 §C で確認する
5. 手順 3 の手直しはこの比較を回しながら行う。設定を直すたびに 2〜4 を再実行し、差分が「oxlint 未実装で移行不可」と判断したものだけになるまで繰り返す（最後にまとめて確認する工程ではない）

### B. lint 対象ファイル集合の突き合わせ

A は「どのルールが有効か」の担保であって「どのファイルが lint されているか」は見ていない。eslint と oxlint では既定の対象拡張子が異なる（oxlint はディレクトリ指定で `mts`/`mjs` 等も対象に含む）ため、検査範囲が意図せず縮小しうる。

手順 1 で取得した一覧と、移行後の oxlint の対象ファイル（実行結果のサマリに件数が出る。`--format json` で一覧も取れる）を比較し、減っているファイルが無いことを確認する。減っていれば拡張子・`ignorePatterns` のどちらが原因かを切り分けて対処する。

### C. 違反コードを実際に置いての実測（A・B で拾えない実挙動の確認）

意図的に違反するコードを書いた使い捨てファイルを置き、発火すべき場所で発火し、除外すべき場所で発火しないことを両方向で実測する。いずれも確認後に削除・revert する。

一時ファイルの混入対策: 削除し忘れて作業ツリーに残ったまま気付かずコミットされる事故を防ぐため、以下のいずれかを徹底する。

- スクリプトで実行する場合は `trap 'rm -f <一時ファイル...>' EXIT` を先頭で仕込み、確認コマンドが失敗しても確実に削除されるようにする
- 各ワークスペースでの実測が一区切りつくたびに `git status --short` を実行し、意図した一時ファイル以外の差分（削除し忘れ・意図しない変更）が残っていないことを確認する
- より厳密に隔離したい場合は `git worktree add` で使い捨ての worktree を切ってそちらで実測し、終わったら worktree ごと `git worktree remove` する（本体の作業ツリーには一切触れない）

発火すべき側:

- `pkgs/typed-api-spec/src/express/` 配下から `src/fastify` を import → strict-dependencies が検出すること（jsPlugin が実際にロードされている証明）
- 未使用変数 `const foo = 1` を追加 → 検出されること
- `any` を使ったコードを追加 → `typescript/no-explicit-any` が検出すること（既定 OFF カテゴリの明示有効化が効いている証明）
- `examples/vite-react-openapi` の component で hooks を条件分岐内で呼ぶ → react hooks ルールが検出すること

発火してはいけない側（除外が広がりすぎていないことの確認）:

- `const _foo = 1` は検出されないこと（`varsIgnorePattern` が効いている証明）
- `*.t-test.ts` に未使用変数を追加 → 検出されないこと（override が効いている証明）
- `ignorePatterns` 対象（`dist/`・`docs/`）に違反ファイルを置く → 検出されないこと、かつ同じ違反を対象ディレクトリに置けば検出されること（除外が意図した範囲に限定されている証明）

### D. 独立レビュー

設定の解釈違い（除外の書き方を誤解してルールごと無効化してしまう等）は、lint が通ったまま検査だけが緩くなるため自分では気づきにくい。A〜C を実施したうえで、実装内容を知らない別エージェントに `.oxlintrc.json` と削除した `eslint.config.js` の突き合わせをレビューさせる。観点は「ルールの取りこぼし」「除外範囲が意図せず広がっていないか」「OFF の理由が実際に検証されたものか」。

## スコープ外

- type-aware lint（`--type-aware` / `oxlint-tsgolint`）の導入 — 別 PR
- lint 未設定の `pkgs/docs`・`examples/vite` への oxlint 新規導入 — 移行 PR の差分を見やすく保つため別 PR
- CI で `examples/vite-react-openapi` の lint を実行するようにすること（現状も未実行のまま）
- eslint には無かった oxlint 独自ルール（unicorn / promise / import の correctness など）の新規有効化 — 今回は eslint との等価性に集中し、上積みは別 PR とする
