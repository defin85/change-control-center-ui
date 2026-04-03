#!/usr/bin/env bash

CCC_REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd)"
CCC_RUN_ROOT="${CCC_REPO_ROOT}/.run/ccc"

ccc_die() {
  printf 'ccc: %s\n' "$*" >&2
  exit 1
}

ccc_note() {
  printf 'ccc: %s\n' "$*"
}

ccc_require_tools() {
  local tool
  for tool in curl flock ss tail; do
    command -v "$tool" >/dev/null 2>&1 || ccc_die "required tool not found: $tool"
  done
}

ccc_ensure_run_root() {
  mkdir -p "$CCC_RUN_ROOT"
}

ccc_acquire_lock() {
  ccc_ensure_run_root
  exec 9>"$CCC_RUN_ROOT/.lock"
  flock -n 9 || ccc_die "another ccc command is already modifying runtime state"
}

ccc_release_lock() {
  flock -u 9 || true
  exec 9>&-
}

ccc_profile_dir() {
  printf '%s/%s' "$CCC_RUN_ROOT" "$1"
}

ccc_log_file() {
  printf '%s/%s.log' "$(ccc_profile_dir "$1")" "$2"
}

ccc_pid_file() {
  printf '%s/%s.pid' "$(ccc_profile_dir "$1")" "$2"
}

ccc_env_file() {
  printf '%s/launch.env' "$(ccc_profile_dir "$1")"
}

ccc_pid_is_running() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

ccc_cleanup_stale_pidfile() {
  local pid_file="$1"
  local pid

  [[ -f "$pid_file" ]] || return 0
  pid="$(<"$pid_file")"
  if ! ccc_pid_is_running "$pid"; then
    rm -f "$pid_file"
  fi
}

ccc_write_env_var() {
  local env_file="$1"
  local name="$2"
  local value="$3"

  printf 'export %s=%q\n' "$name" "$value" >>"$env_file"
}
