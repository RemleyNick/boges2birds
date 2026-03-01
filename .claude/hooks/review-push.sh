#!/usr/bin/env bash
#
# Pre-push commit review hook for Claude Code
#
# Fires on every Bash tool call. Intercepts `git push`, runs an AI (or heuristic)
# review of unpushed commits, outputs the review to stderr, and exits 2 (block).
#
# After the user approves the review, Claude re-runs as `git push --no-verify`,
# which skips this hook (exits 0) and lets the push go through.

# ── Read hook payload from stdin ───────────────────────────────────────────────
INPUT=$(cat)

# Extract the Bash command string from the JSON payload
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

# ── Only intercept git push ────────────────────────────────────────────────────
if ! echo "$COMMAND" | grep -q 'git push'; then
    exit 0
fi

# Skip if --no-verify is present (user has already approved this push)
if echo "$COMMAND" | grep -q -- '--no-verify'; then
    exit 0
fi

# ── Gather commit info ─────────────────────────────────────────────────────────
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Determine upstream tracking branch, fall back to origin/<branch>
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "origin/$BRANCH")

# Get unpushed commits
COMMITS=$(git log "${UPSTREAM}..HEAD" --oneline 2>/dev/null || echo "")

# If there's nothing to push, let it through
if [ -z "$COMMITS" ]; then
    exit 0
fi

# Get a summary of changed files
DIFF_STAT=$(git diff --stat "${UPSTREAM}..HEAD" 2>/dev/null || echo "(diff unavailable)")

# ── AI Review (claude -p subprocess) ──────────────────────────────────────────
REVIEW=""

if command -v claude &>/dev/null && [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    PROMPT="You are a senior engineer reviewing commits before a push to GitHub.

Project conventions (boges2birds — Expo React Native golf training app):
- Conventional commits required: feat:, fix:, refactor:, chore:, docs:, test:, style:, perf:
- Each commit should represent one logical change
- No debug code left in (console.log, debugger)
- No hardcoded secrets, API keys, or credentials
- Engine layer (src/engine/) must never import React or Zustand
- Zustand = ephemeral UI state only; TanStack Query = all DB-sourced data; never duplicate

Commits to push (${BRANCH} → ${UPSTREAM}):
${COMMITS}

Changed files:
${DIFF_STAT}

Provide a concise review (3–6 bullet points). Flag any issues clearly.
End with either 'APPROVED ✓' or 'CONCERNS FOUND ⚠️' on its own line."

    REVIEW=$(claude -p "$PROMPT" 2>/dev/null || echo "")
fi

# ── Heuristic Fallback ─────────────────────────────────────────────────────────
if [ -z "$REVIEW" ]; then
    ISSUES=""

    # Check each commit message for conventional commit format
    while IFS= read -r line; do
        MSG=$(echo "$line" | cut -d' ' -f2-)
        if ! echo "$MSG" | grep -qE '^(feat|fix|refactor|chore|docs|test|style|perf)(\(.+\))?: .+'; then
            ISSUES="${ISSUES}  ⚠️  Non-conventional commit: \"${MSG}\"\n"
        fi
    done <<< "$COMMITS"

    # Check diff for debug code and common issues
    DIFF=$(git diff "${UPSTREAM}..HEAD" 2>/dev/null || echo "")
    if echo "$DIFF" | grep -qE '^\+.*(console\.log|debugger)'; then
        ISSUES="${ISSUES}  ⚠️  Debug code detected (console.log or debugger)\n"
    fi
    if echo "$DIFF" | grep -qE '^\+.*(TODO|FIXME)'; then
        ISSUES="${ISSUES}  ⚠️  TODO/FIXME markers in new code\n"
    fi
    # Rough secret pattern check (not exhaustive)
    if echo "$DIFF" | grep -qE '^\+.*(sk-[A-Za-z0-9]{20,}|PRIVATE_KEY|api_secret\s*=)'; then
        ISSUES="${ISSUES}  ⚠️  Possible hardcoded secret or API key\n"
    fi

    if [ -z "$ISSUES" ]; then
        REVIEW="✓ Heuristic checks passed — no obvious issues found.

Commits look clean. No debug code, non-conventional messages, or secret patterns detected."
    else
        REVIEW="Heuristic review found issues:

$(echo -e "$ISSUES")"
    fi
fi

# ── Output Review to stderr ────────────────────────────────────────────────────
cat >&2 <<EOF
╔══════════════════════════════════════════════════════════════════╗
║                    PRE-PUSH COMMIT REVIEW                        ║
╚══════════════════════════════════════════════════════════════════╝

  Branch:  ${BRANCH} → ${UPSTREAM}

  Commits to push:
$(echo "$COMMITS" | sed 's/^/    /')

  Changed files:
$(echo "$DIFF_STAT" | sed 's/^/    /')

── Review ─────────────────────────────────────────────────────────────────────

${REVIEW}

── Action Required ─────────────────────────────────────────────────────────────

Push is BLOCKED pending your review. If you approve, re-run the push as:

    git push --no-verify

This bypasses the review hook for this one push.

EOF

exit 2
