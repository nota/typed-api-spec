import os

TMP = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(TMP)

def load_lines(path):
    with open(path) as f:
        return [line.strip() for line in f if line.strip()]

cases = [
    ("pkgs/typed-api-spec", "eslint-files-typed-api-spec.txt", "oxlint-files-typed-api-spec.txt"),
    ("examples/misc", "eslint-files-examples-misc.txt", "oxlint-files-examples-misc.txt"),
    ("examples/vite-react-openapi", "eslint-files-vite-react-openapi.txt", "oxlint-files-vite-react-openapi.txt"),
]

for workspace, eslint_file, oxlint_file in cases:
    print(f"\n=== {workspace} ===")
    workspace_abs = os.path.join(REPO, workspace) + os.sep

    # eslint dump holds absolute paths; oxlint --debug=files holds paths
    # relative to the workspace dir. Normalize both to workspace-relative.
    e_files = set()
    for line in load_lines(f"{TMP}/{eslint_file}"):
        rel = line[len(workspace_abs):] if line.startswith(workspace_abs) else line
        e_files.add(rel)
    o_files = set(load_lines(f"{TMP}/{oxlint_file}"))

    missing = sorted(e_files - o_files)
    extra = sorted(o_files - e_files)

    print(f"eslint: {len(e_files)} files, oxlint: {len(o_files)} files")
    if missing:
        print(f"  MISSING in oxlint ({len(missing)}): previously linted, now skipped")
        for f in missing:
            print(f"    - {f}")
    if extra:
        print(f"  EXTRA in oxlint ({len(extra)}): newly linted, not previously covered")
        for f in extra:
            print(f"    - {f}")
    if not missing and not extra:
        print("  OK (identical file sets)")
