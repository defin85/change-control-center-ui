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

ccc_python_bin() {
  if command -v python >/dev/null 2>&1; then
    printf 'python'
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    printf 'python3'
    return 0
  fi
  ccc_die "required tool not found: python or python3"
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

ccc_install_profile_cleanup_trap() {
  local profile="$1"
  local trap_cmd

  printf -v trap_cmd 'ccc_stop_profile %q' "$profile"
  trap "$trap_cmd" EXIT INT TERM
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

ccc_process_target_is_running() {
  local target="${1:-}"
  [[ -n "$target" ]] || return 1
  kill -0 -- "$target" 2>/dev/null
}

ccc_cleanup_stale_pidfile() {
  local pid_file="$1"
  local target

  [[ -f "$pid_file" ]] || return 0
  target="$(<"$pid_file")"
  if ! ccc_process_target_is_running "$target"; then
    rm -f "$pid_file"
  fi
}

ccc_write_env_var() {
  local env_file="$1"
  local name="$2"
  local value="$3"

  printf 'export %s=%q\n' "$name" "$value" >>"$env_file"
}
