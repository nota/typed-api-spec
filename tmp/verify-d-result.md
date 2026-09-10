# 検証 D. 独立レビュー結果

レビュー方法: 実装内容を知らない別エージェント（Codex CLI）に、削除前の `eslint.config.js`（`git show 3122e27^:...`）と移行後の `.oxlintrc.json`（pkgs/typed-api-spec / examples/misc / examples/vite-react-openapi）を独立に突き合わせさせた。観点は「ルールの取りこぼし」「除外範囲が意図せず広がっていないか」「OFF の理由が実際に検証されたものか」の3点。

レビュー担当エージェントは、削除前コミットを別クローンで `npm ci` して `eslint --print-config` を再実行し、記録済みダンプと一致することを確認した上で、`.oxlintrc.json` と静的に突き合わせている（他エージェントが用意した資料を鵜呑みにせず独立に再検証済み）。

## ルールの取りこぼし

- `pkgs/typed-api-spec`: 有効ルール数 67→66、`examples/misc`: 66→65。差分は `no-octal` のみ（oxlint未実装）。ただし旧 ESLint でも8進数リテラルは構文エラー（パースエラー）になるため、実質的な検査漏れにはならない
- `pkgs/typed-api-spec` の `strict-dependencies`・`no-unused-vars` の3オプション（`varsIgnorePattern`/`argsIgnorePattern`/`caughtErrors`）・`*.t-test.ts` override・`dist`/`docs` ignore は旧設定と完全一致
- **`examples/vite-react-openapi` で `react-hooks/config`・`react-hooks/gating` の2ルールが実際に失われている**（oxlintに対応実装が無い）。既知の非等価性として受容する方針だが、`oxlint-migration-plan.md` に記録が一切無い（`grep` でゼロヒット確認済み）← 唯一の実質的な指摘

## 除外範囲

`ignorePatterns`・overrides は旧設定をそのまま移植しており、意図せず広がっている箇所はなし。検証Bで見つかった vite-react-openapi 側の1件差分（`eslint.config.js`）も、削除されたファイル自体が対象から消えただけで実害なし。

## OFF の理由が実際に検証されたものか

`typescript/no-explicit-any`・`no-empty-object-type`・`no-namespace`・`no-unsafe-function-type` は3パッケージ全てで明示的に `error` になっており、`correctness` カテゴリも明示列挙されているため、oxlint既定値への暗黙依存は無い。カテゴリ既定OFFのルールが「OFFのまま放置されている」ケースは見つからなかった。

## 結論

設定移植そのものは妥当。唯一の実質的な指摘は「`react-hooks/config`・`react-hooks/gating` の喪失が意図的な受容にもかかわらず計画書に記録されていないこと」。ドキュメント修正（`oxlint-migration-plan.md` の react-hooks 関連記述への一文追記）で対応可能。

---

※ この過程で検証A〜Cのスクリプト自体（`tmp/compare_rules.py`・`compare_files.py`・`verify_c.sh`）の設計上の弱点も別途指摘されたが、本ファイルは検証D本来の観点（設定移植の正しさ）のみを記録する。スクリプト側の指摘は別途対応要否を判断する。
