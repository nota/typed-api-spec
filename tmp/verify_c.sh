#!/usr/bin/env bash
# Verification §C: intentional-violation probes for the ESLint -> Oxlint migration.
# Confirms rules fire where they should and stay silent where they shouldn't,
# covering behavior that a static config diff (§A/§B) cannot observe:
# jsPlugin loading, ignorePatterns scoping, and override precedence.
set -u
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0

check() {
  local desc="$1" expect="$2" # expect: fire | silent
  local out="$3"
  local fired="silent"
  [ -n "$out" ] && fired="fire"
  if [ "$fired" = "$expect" ]; then
    echo "PASS: $desc (expected=$expect, got=$fired)"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $desc (expected=$expect, got=$fired)"
    echo "$out" | sed 's/^/    /'
    FAIL=$((FAIL + 1))
  fi
}

# For "should be excluded by ignorePatterns" probes specifically: an empty
# grep match is ambiguous by itself — `npx oxlint <path>` prints the exact
# same "No files found to lint" message (and exit 1) whether the path was
# genuinely excluded by ignorePatterns or the probe file was never created
# (typo, missing mkdir, etc.). Confirmed empirically: both cases are
# byte-identical on stdout/stderr/exit code. So this check requires BOTH the
# file to actually exist on disk AND oxlint's raw output to contain the
# "no files found" signal — neither signal alone is trustworthy.
check_ignored() {
  local desc="$1" filepath="$2" raw_out="$3"
  if [ ! -f "$filepath" ]; then
    echo "FAIL: $desc (setup broken: $filepath was never created, so oxlint's silence proves nothing)"
    FAIL=$((FAIL + 1))
  elif echo "$raw_out" | grep -q "No files found to lint"; then
    echo "PASS: $desc (file exists on disk and was excluded)"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $desc (file exists but was not excluded, or oxlint failed unexpectedly)"
    echo "$raw_out" | sed 's/^/    /'
    FAIL=$((FAIL + 1))
  fi
}

### pkgs/typed-api-spec ###
cd "$REPO/pkgs/typed-api-spec"
trap 'rm -f src/express/_verify-strict-deps.ts src/_verify-unused.ts src/_verify-unused.t-test.ts src/_verify-ignore.ts dist/_verify-ignore.ts docs/_verify-ignore.ts' EXIT

echo "$(printf '\n%.0s' {1..1})--- pkgs/typed-api-spec ---"

echo 'import "../fastify";' > src/express/_verify-strict-deps.ts
out=$(npx oxlint src/express/_verify-strict-deps.ts 2>&1 | grep "strict-dependencies")
check "strict-dependencies fires on forbidden cross-module import (jsPlugin loaded)" fire "$out"
rm -f src/express/_verify-strict-deps.ts

cat > src/_verify-unused.ts <<'EOF'
const foo = 1;
const _bar = 1;
const baz: any = 1;
EOF
out_all=$(npx oxlint src/_verify-unused.ts 2>&1)
out_foo=$(echo "$out_all" | grep "'foo'")
check "no-unused-vars fires on unprefixed unused var" fire "$out_foo"
out_bar=$(echo "$out_all" | grep "'_bar'")
check "no-unused-vars stays silent on _-prefixed var (varsIgnorePattern)" silent "$out_bar"
out_any=$(echo "$out_all" | grep "no-explicit-any")
check "no-explicit-any fires (restriction category explicitly enabled)" fire "$out_any"

cp src/_verify-unused.ts src/_verify-unused.t-test.ts
out_ttest=$(npx oxlint src/_verify-unused.t-test.ts 2>&1)
out_ttest_baz=$(echo "$out_ttest" | grep "'baz'")
check "no-unused-vars stays silent in *.t-test.ts (override)" silent "$out_ttest_baz"
out_ttest_any=$(echo "$out_ttest" | grep "no-explicit-any")
check "no-explicit-any still fires in *.t-test.ts (override is narrow)" fire "$out_ttest_any"
rm -f src/_verify-unused.ts src/_verify-unused.t-test.ts

mkdir -p dist docs
echo 'const foo = 1;' > dist/_verify-ignore.ts
echo 'const foo = 1;' > docs/_verify-ignore.ts
echo 'const foo = 1;' > src/_verify-ignore.ts
raw_dist=$(npx oxlint dist/_verify-ignore.ts 2>&1)
check_ignored "ignorePatterns excludes dist/" "dist/_verify-ignore.ts" "$raw_dist"
raw_docs=$(npx oxlint docs/_verify-ignore.ts 2>&1)
check_ignored "ignorePatterns excludes docs/" "docs/_verify-ignore.ts" "$raw_docs"
out_src=$(npx oxlint src/_verify-ignore.ts 2>&1 | grep "'foo'")
check "same violation fires in src/ (exclusion is scoped, not global)" fire "$out_src"
rm -f dist/_verify-ignore.ts docs/_verify-ignore.ts src/_verify-ignore.ts
trap - EXIT

### examples/misc ###
cd "$REPO/examples/misc"
trap 'rm -f simple/_verify-unused.ts dist/_verify-ignore.ts simple/_verify-ignore.ts' EXIT

echo "$(printf '\n%.0s' {1..1})--- examples/misc ---"

cat > simple/_verify-unused.ts <<'EOF'
const foo = 1;
const baz: any = 1;
EOF
out_misc_all=$(npx oxlint simple/_verify-unused.ts 2>&1)
out_misc_foo=$(echo "$out_misc_all" | grep "'foo'")
check "no-unused-vars fires (examples/misc)" fire "$out_misc_foo"
out_misc_any=$(echo "$out_misc_all" | grep "no-explicit-any")
check "no-explicit-any fires (examples/misc, restriction category explicitly enabled)" fire "$out_misc_any"
rm -f simple/_verify-unused.ts

mkdir -p dist
echo 'const foo = 1;' > dist/_verify-ignore.ts
echo 'const foo = 1;' > simple/_verify-ignore.ts
raw_misc_dist=$(npx oxlint dist/_verify-ignore.ts 2>&1)
check_ignored "ignorePatterns excludes dist/ (examples/misc)" "dist/_verify-ignore.ts" "$raw_misc_dist"
out_misc_src=$(npx oxlint simple/_verify-ignore.ts 2>&1 | grep "'foo'")
check "same violation fires outside dist/ (examples/misc)" fire "$out_misc_src"
rm -f dist/_verify-ignore.ts simple/_verify-ignore.ts
trap - EXIT

### examples/vite-react-openapi ###
cd "$REPO/examples/vite-react-openapi"
trap 'rm -f src/_verify-hooks.tsx' EXIT

echo "$(printf '\n%.0s' {1..1})--- examples/vite-react-openapi ---"
cat > src/_verify-hooks.tsx <<'EOF'
import { useState } from 'react'

function Comp({ cond }: { cond: boolean }) {
  if (cond) {
    const [x] = useState(0)
    return <div>{x}</div>
  }
  return null
}

export default Comp
EOF
out_hooks=$(npx oxlint src/_verify-hooks.tsx 2>&1 | grep "rules-of-hooks")
check "react-hooks(rules-of-hooks) fires on conditional hook call" fire "$out_hooks"
rm -f src/_verify-hooks.tsx
trap - EXIT

echo ""
echo "=== summary: $PASS passed, $FAIL failed ==="

cd "$REPO"
residue=$(git status --short pkgs/typed-api-spec examples/misc examples/vite-react-openapi)
if [ -n "$residue" ]; then
  echo "WARNING: leftover changes after cleanup:"
  echo "$residue"
  FAIL=$((FAIL + 1))
else
  echo "git status clean: no leftover probe files"
fi

exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
