#!/usr/bin/env bash

ccc_port_listening() {
  local port="$1"
  ss -ltnH "( sport = :${port} )" 2>/dev/null | grep -q .
}

ccc_assert_port_available() {
  local profile="$1"
  local component="$2"
  local port="$3"
  local pid_file
  local pid

  pid_file="$(ccc_pid_file "$profile" "$component")"
  ccc_cleanup_stale_pidfile "$pid_file"
  if [[ -f "$pid_file" ]]; then
    pid="$(<"$pid_file")"
    ccc_die "$profile/$component is already running with pid $pid; use restart or stop first"
  fi

  if ccc_port_listening "$port"; then
    ccc_die "port $port is already occupied; refusing to reuse an unmanaged process for $profile/$component"
  fi
}

ccc_wait_for_http() {
  local url="$1"
  local timeout_seconds="$2"
  local deadline=$((SECONDS + timeout_seconds))

  while (( SECONDS < deadline )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done

  return 1
}

ccc_wait_for_component() {
  local target="$1"
  local url="$2"
  local timeout_seconds="$3"
  local deadline=$((SECONDS + timeout_seconds))
  local healthy_streak=0
  local required_healthy_streak=5

  while (( SECONDS < deadline )); do
    if ! ccc_process_target_is_running "$target"; then
      return 1
    fi
    if curl -fsS "$url" >/dev/null 2>&1; then
      healthy_streak=$((healthy_streak + 1))
      # Treat ready as sustained health, not a single transient success.
      if (( healthy_streak >= required_healthy_streak )); then
        ccc_process_target_is_running "$target"
        return $?
      fi
    else
      healthy_streak=0
    fi
    sleep 0.2
  done

  return 1
}

ccc_stop_process_target() {
  local target="$1"
  local deadline

  if ! ccc_process_target_is_running "$target"; then
    return 0
  fi

  kill -- "$target" 2>/dev/null || true
  deadline=$((SECONDS + 10))
  while (( SECONDS < deadline )); do
    if ! ccc_process_target_is_running "$target"; then
      return 0
    fi
    sleep 0.2
  done

  kill -KILL -- "$target" 2>/dev/null || true
  deadline=$((SECONDS + 2))
  while (( SECONDS < deadline )); do
    if ! ccc_process_target_is_running "$target"; then
      return 0
    fi
    sleep 0.2
  done

  ccc_die "failed to stop process target $target"
}

ccc_stop_component() {
  local profile="$1"
  local component="$2"
  local pid_file
  local pid

  pid_file="$(ccc_pid_file "$profile" "$component")"
  ccc_cleanup_stale_pidfile "$pid_file"
  if [[ ! -f "$pid_file" ]]; then
    return 0
  fi

  pid="$(<"$pid_file")"
  ccc_stop_process_target "$pid"
  rm -f "$pid_file"
}

ccc_assert_web_artifact_ready() {
  local web_dist="${CCC_REPO_ROOT}/web/dist"
  local index_html="${web_dist}/index.html"
  local assets_glob="${web_dist}/assets/*"

  [[ -f "$index_html" ]] || ccc_die "backend-served UI artifact missing: $index_html. Run ./scripts/ccc build web first."
  compgen -G "$assets_glob" >/dev/null || ccc_die "backend-served UI assets missing under ${web_dist}/assets. Run ./scripts/ccc build web first."
}

ccc_start_component() {
  local profile="$1"
  local component="$2"
  local port="$3"
  local health_url="$4"
  local timeout_seconds="$5"
  local workdir="$6"
  local detach="$7"
  local env_name="$8"
  local cmd_name="$9"
  local -n env_ref="$env_name"
  local -n cmd_ref="$cmd_name"
  local profile_dir
  local pid_file
  local log_file
  local pid
  local python_bin
  local helper_path
  local spawn_cmd
  local env_var

  profile_dir="$(ccc_profile_dir "$profile")"
  mkdir -p "$profile_dir"
  pid_file="$(ccc_pid_file "$profile" "$component")"
  log_file="$(ccc_log_file "$profile" "$component")"

  ccc_assert_port_available "$profile" "$component" "$port"
  : >"$log_file"

  if [[ "$detach" == "1" ]]; then
    python_bin="$(ccc_python_bin)"
    helper_path="${CCC_REPO_ROOT}/scripts/lib/ccc/spawn_detached.py"
    spawn_cmd=("$python_bin" "$helper_path" --workdir "$workdir" --log-file "$log_file")
    for env_var in "${env_ref[@]}"; do
      spawn_cmd+=(--env "$env_var")
    done
    spawn_cmd+=(-- "${cmd_ref[@]}")
    pid="$("${spawn_cmd[@]}")"
    printf '%s\n' "$pid" >"$pid_file"
  else
    (
      cd "$workdir"
      env "${env_ref[@]}" "${cmd_ref[@]}"
    ) >>"$log_file" 2>&1 &
    pid=$!
    printf '%s\n' "$pid" >"$pid_file"
  fi

  if ! ccc_wait_for_component "$pid" "$health_url" "$timeout_seconds"; then
    ccc_stop_process_target "$pid" || true
    rm -f "$pid_file"
    ccc_die "failed to start $profile/$component; see $log_file"
  fi
}

ccc_wait_on_component() {
  local profile="$1"
  local component="$2"
  local pid_file
  local pid

  pid_file="$(ccc_pid_file "$profile" "$component")"
  ccc_cleanup_stale_pidfile "$pid_file"
  [[ -f "$pid_file" ]] || ccc_die "no running pid recorded for $profile/$component"

  pid="$(<"$pid_file")"
  wait "$pid"
}

ccc_component_status() {
  local profile="$1"
  local component="$2"
  local health_url="$3"
  local pid_file
  local pid
  local identity

  pid_file="$(ccc_pid_file "$profile" "$component")"
  ccc_cleanup_stale_pidfile "$pid_file"
  if [[ ! -f "$pid_file" ]]; then
    printf 'stopped'
    return 0
  fi

  pid="$(<"$pid_file")"
  if [[ "$pid" == -* ]]; then
    identity="pgid=${pid#-}"
  else
    identity="pid=$pid"
  fi
  if curl -fsS "$health_url" >/dev/null 2>&1; then
    printf 'running %s health=ok log=%s' "$identity" "$(ccc_log_file "$profile" "$component")"
    return 0
  fi

  if ! ccc_process_target_is_running "$pid"; then
    rm -f "$pid_file"
    printf 'stopped'
    return 0
  fi

  printf 'running %s health=degraded log=%s' "$identity" "$(ccc_log_file "$profile" "$component")"
}
