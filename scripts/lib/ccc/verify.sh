#!/usr/bin/env bash

ccc_run_in_dir() {
  local workdir="$1"
  shift

  (
    cd "$workdir"
    "$@"
  )
}

ccc_run_verify_playwright_phase() {
  local npm_script="$1"
  local status=0

  ccc_with_lock ccc_stop_profile e2e

  set +e
  ccc_run_in_dir "${CCC_REPO_ROOT}/web" npm run "$npm_script"
  status=$?
  set -e

  ccc_with_lock ccc_stop_profile e2e
  return "$status"
}

ccc_verify() {
  local suite="$1"

  case "$suite" in
    ui-smoke)
      ccc_run_in_dir "$CCC_REPO_ROOT" uv run pytest backend/tests -q
      ccc_run_in_dir "${CCC_REPO_ROOT}/web" npm run build
      ccc_run_verify_playwright_phase test:e2e
      ;;
    ui-platform)
      ccc_verify ui-smoke
      ccc_run_in_dir "${CCC_REPO_ROOT}/web" npm run lint
      ccc_run_verify_playwright_phase test:e2e:platform
      ;;
    ui-full)
      ccc_verify ui-platform
      ccc_run_verify_playwright_phase test:e2e:full
      ;;
    *)
      ccc_die "unknown verify suite: ${suite:-<missing>}"
      ;;
  esac
}
