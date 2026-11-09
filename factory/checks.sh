#!/usr/bin/env bash
# Project checks for the software factory. Contract (plugin DESIGN.md · "checks.sh contract"):
# - non-interactive; installs dependencies on a fresh worktree
# - runs lint, typecheck, tests and build
# - never rewrites tracked files (no --fix, no snapshot updates)
# - exits non-zero on any failure
# It runs with the job's worktree as the CURRENT WORKING DIRECTORY, and the gate always uses
# the copy on origin/<base_branch>, never the one on the job's branch.
set -euo pipefail

export CI=true

step() { printf '\n==> %s\n' "$*"; }

step "install dependencies (npm ci)"
npm ci --no-audit --no-fund --loglevel=error

step "format check (prettier --check)"
npm run --silent format

step "lint (eslint)"
npm run --silent lint

step "typecheck (tsc --noEmit)"
npm run --silent typecheck

step "tests (vitest run)"
npm run --silent test -- --reporter=dot

step "build (vite build, single file)"
npm run --silent build
test -s dist/index.html

printf '\nchecks: all green\n'
