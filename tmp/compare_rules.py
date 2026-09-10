import json, fnmatch, os

TMP = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(TMP)

def load_json(path):
    with open(path) as f:
        return json.load(f)

def split_sev_options(val):
    """Return (severity, options) where options is a JSON-comparable value
    (None if the rule has no extra config beyond severity)."""
    if isinstance(val, list):
        sev, rest = val[0], val[1:]
    else:
        sev, rest = val, []
    return sev, (rest if rest else None)

def eslint_enabled(cfg):
    out = {}
    for name, val in cfg.get("rules", {}).items():
        sev, options = split_sev_options(val)
        if sev in (0, "off"):
            continue
        out[name] = ("warn" if sev in (1, "warn") else "error", options)
    return out

# rules oxlint implements as a single unprefixed rule instead of a
# typescript/-namespaced one (base ESLint rule + @typescript-eslint variant
# merged into one implementation).
UNPREFIXED_IN_OXLINT = {
    "class-methods-use-this", "default-param-last", "init-declarations",
    "max-params", "no-array-constructor", "no-dupe-class-members",
    "no-empty-function", "no-invalid-this", "no-loop-func",
    "no-loss-of-precision", "no-magic-numbers", "no-redeclare",
    "no-restricted-imports", "no-shadow", "no-unused-expressions",
    "no-unused-vars", "no-use-before-define", "no-useless-constructor",
}

# Rules with no oxlint implementation at all (per @oxlint/migrate --details
# "Unsupported"/"Nursery" output). Every entry here must actually appear as a
# gap for at least one of the `cases` below, or it's dead code masking a
# comparison that was never exercised — verify with `grep KNOWN_UNSUPPORTED`
# against the printed "known unsupported" lines after any change to `cases`.
KNOWN_UNSUPPORTED = {
    "no-octal",  # superseded by strict mode (always-strict ESM)
    "react/config", "react/gating",  # oxlint has no React Compiler config/gating options
}

def normalize_name(name):
    if name.startswith("@typescript-eslint/"):
        base = name[len("@typescript-eslint/"):]
        return base if base in UNPREFIXED_IN_OXLINT else f"typescript/{base}"
    if name.startswith("react-hooks/"):
        return "react/" + name[len("react-hooks/"):]
    if name.startswith("react-refresh/"):
        return "react/" + name[len("react-refresh/"):]
    return name

def expand_braces(pattern):
    if "{" not in pattern:
        return [pattern]
    pre, rest = pattern.split("{", 1)
    group, post = rest.split("}", 1)
    return [pre + opt + post for opt in group.split(",")]

def file_matches(filename, pattern):
    return any(fnmatch.fnmatch(filename, p) or fnmatch.fnmatch("./" + filename, p)
               for p in expand_braces(pattern))

def oxlint_enabled_for_file(cfg, filename):
    merged = {}
    for name, val in cfg.get("rules", {}).items():
        sev, options = split_sev_options(val)
        if sev == "off":
            merged.pop(name, None)
        else:
            merged[name] = ("warn" if sev == "warn" else "error", options)
    for override in cfg.get("overrides", []):
        if not any(file_matches(filename, p) for p in override.get("files", [])):
            continue
        for name, val in override.get("rules", {}).items():
            sev, options = split_sev_options(val)
            if sev == "off":
                merged.pop(name, None)
            else:
                merged[name] = ("warn" if sev == "warn" else "error", options)
    return merged

cases = [
    ("typed-api-spec (normal .ts)", "eslint-config-typed-api-spec-normal.json",
     "pkgs/typed-api-spec/.oxlintrc.json", "src/index.ts"),
    ("typed-api-spec (t-test)", "eslint-config-typed-api-spec-ttest.json",
     "pkgs/typed-api-spec/.oxlintrc.json", "src/core/schema.t-test.ts"),
    ("examples/misc", "eslint-config-examples-misc.json",
     "examples/misc/.oxlintrc.json", "simple/spec.ts"),
    ("vite-react-openapi", "eslint-config-vite-react-openapi.json",
     "examples/vite-react-openapi/.oxlintrc.json", "src/main.tsx"),
]

for label, eslint_dump, oxlintrc_rel, filename in cases:
    print(f"\n=== {label} ({filename}) ===")
    ecfg = load_json(f"{TMP}/{eslint_dump}")
    ocfg = load_json(f"{REPO}/{oxlintrc_rel}")

    e_raw = eslint_enabled(ecfg)
    o_rules = oxlint_enabled_for_file(ocfg, filename)

    e_norm = {}
    for name, sev_opts in e_raw.items():
        e_norm[normalize_name(name)] = sev_opts

    e_names, o_names = set(e_norm), set(o_rules)
    missing = sorted(n for n in (e_names - o_names) if n not in KNOWN_UNSUPPORTED)
    known_gaps = sorted(n for n in (e_names - o_names) if n in KNOWN_UNSUPPORTED)
    extra = sorted(o_names - e_names)
    common = e_names & o_names
    sev_mismatch = sorted(n for n in common if e_norm[n][0] != o_rules[n][0])
    # Only compare options where oxlint has an explicit, hand-authored options
    # value (o_rules[n][1] is not None) — e.g. no-unused-vars, strict-dependencies.
    # ESLint's --print-config always materializes each rule's built-in default
    # options even when the source config left them unset, but oxlint's raw
    # .oxlintrc.json (and even its own --print-config, confirmed empirically)
    # never does. Comparing eslint's filled-in defaults against oxlint's "null"
    # for every untouched rule would just report the two tools' differing
    # internal defaults, not a migration regression — that's covered by
    # verification §C's runtime probes instead.
    options_mismatch = sorted(
        n for n in common
        if e_norm[n][0] == o_rules[n][0]
        and o_rules[n][1] is not None
        and e_norm[n][1] != o_rules[n][1]
    )

    print(f"eslint enabled: {len(e_names)}, oxlint enabled: {len(o_names)}")
    if missing:
        print(f"  MISSING (unexplained) ({len(missing)}):")
        for n in missing:
            print(f"    - {n} (eslint: {e_norm[n][0]})")
    if known_gaps:
        print(f"  known unsupported (documented, no action needed): {known_gaps}")
    if extra:
        print(f"  EXTRA in oxlint ({len(extra)}): {extra}")
    if sev_mismatch:
        print(f"  SEVERITY MISMATCH ({len(sev_mismatch)}):")
        for n in sev_mismatch:
            print(f"    - {n}: eslint={e_norm[n][0]} oxlint={o_rules[n][0]}")
    if options_mismatch:
        print(f"  OPTIONS MISMATCH ({len(options_mismatch)}):")
        for n in options_mismatch:
            print(f"    - {n}:")
            print(f"        eslint: {json.dumps(e_norm[n][1])}")
            print(f"        oxlint: {json.dumps(o_rules[n][1])}")
    if not missing and not sev_mismatch and not options_mismatch:
        print("  OK (no unexplained gaps, no severity/options drift)")

used_gaps = set()
for label, eslint_dump, oxlintrc_rel, filename in cases:
    ecfg = load_json(f"{TMP}/{eslint_dump}")
    ocfg = load_json(f"{REPO}/{oxlintrc_rel}")
    e_names = {normalize_name(n) for n in eslint_enabled(ecfg)}
    o_names = set(oxlint_enabled_for_file(ocfg, filename))
    used_gaps |= (e_names - o_names) & KNOWN_UNSUPPORTED
unused_gaps = KNOWN_UNSUPPORTED - used_gaps
if unused_gaps:
    print(f"\nWARNING: KNOWN_UNSUPPORTED entries never observed as a gap in any case "
          f"(dead code, remove or investigate): {sorted(unused_gaps)}")
