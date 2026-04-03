#!/usr/bin/env bash

CCC_PROFILE_COMPONENTS=()
CCC_PROFILE_PRIMARY_COMPONENT=""
CCC_E2E_DATA_DIR=""
CCC_E2E_DB_PATH=""

CCC_COMPONENT_PORT=""
CCC_COMPONENT_HEALTH_URL=""
CCC_COMPONENT_TIMEOUT_SECONDS=""
CCC_COMPONENT_WORKDIR=""
CCC_COMPONENT_ENV=()
CCC_COMPONENT_CMD=()

ccc_load_profile_definition() {
  local profile="$1"

  case "$profile" in
    dev)
      CCC_PROFILE_COMPONENTS=(sidecar backend vite)
      CCC_PROFILE_PRIMARY_COMPONENT="vite"
      ;;
    served)
      CCC_PROFILE_COMPONENTS=(sidecar backend)
      CCC_PROFILE_PRIMARY_COMPONENT="backend"
      ;;
    e2e)
      CCC_PROFILE_COMPONENTS=(sidecar backend)
      CCC_PROFILE_PRIMARY_COMPONENT="backend"
      ;;
    *)
      ccc_die "unknown profile: $profile"
      ;;
  esac
}

ccc_prepare_profile_start() {
  local profile="$1"
  local profile_dir
  local env_file

  profile_dir="$(ccc_profile_dir "$profile")"
  mkdir -p "$profile_dir"
  env_file="$(ccc_env_file "$profile")"
  : >"$env_file"

  case "$profile" in
    dev|served)
      ccc_write_env_var "$env_file" "CCC_RUNTIME_TRANSPORT" "${CCC_RUNTIME_TRANSPORT:-stdio}"
      if [[ -n "${CCC_RUNTIME_COMMAND:-}" ]]; then
        ccc_write_env_var "$env_file" "CCC_RUNTIME_COMMAND" "${CCC_RUNTIME_COMMAND}"
      fi
      if [[ -n "${CCC_RUNTIME_WS_URL:-}" ]]; then
        ccc_write_env_var "$env_file" "CCC_RUNTIME_WS_URL" "${CCC_RUNTIME_WS_URL}"
      fi
      if [[ -n "${CCC_DB_PATH:-}" ]]; then
        ccc_write_env_var "$env_file" "CCC_DB_PATH" "${CCC_DB_PATH}"
      fi
      if [[ -n "${CCC_DATA_DIR:-}" ]]; then
        ccc_write_env_var "$env_file" "CCC_DATA_DIR" "${CCC_DATA_DIR}"
      fi
      ;;
    e2e)
      CCC_E2E_DATA_DIR="$(mktemp -d "${profile_dir}/data.XXXXXX")"
      CCC_E2E_DB_PATH="${CCC_E2E_DATA_DIR}/ccc-e2e.db"
      ccc_write_env_var "$env_file" "CCC_RUNTIME_TRANSPORT" "stdio"
      ccc_write_env_var "$env_file" "CCC_RUNTIME_COMMAND" "uv run python backend/tests/fake_stdio_app_server.py"
      ccc_write_env_var "$env_file" "CCC_RUNTIME_SIDECAR_URL" "http://127.0.0.1:8010"
      ccc_write_env_var "$env_file" "CCC_DATA_DIR" "$CCC_E2E_DATA_DIR"
      ccc_write_env_var "$env_file" "CCC_DB_PATH" "$CCC_E2E_DB_PATH"
      ;;
  esac
}

ccc_load_component_definition() {
  local profile="$1"
  local component="$2"

  CCC_COMPONENT_ENV=()

  case "${profile}:${component}" in
    dev:sidecar)
      CCC_COMPONENT_PORT="8010"
      CCC_COMPONENT_HEALTH_URL="http://127.0.0.1:8010/healthz"
      CCC_COMPONENT_TIMEOUT_SECONDS="30"
      CCC_COMPONENT_WORKDIR="$CCC_REPO_ROOT"
      CCC_COMPONENT_CMD=(uv run uvicorn backend.sidecar.main:create_app --factory --reload --host 127.0.0.1 --port 8010)
      ;;
    dev:backend)
      CCC_COMPONENT_PORT="8000"
      CCC_COMPONENT_HEALTH_URL="http://127.0.0.1:8000/api/bootstrap"
      CCC_COMPONENT_TIMEOUT_SECONDS="30"
      CCC_COMPONENT_WORKDIR="$CCC_REPO_ROOT"
      CCC_COMPONENT_ENV=("CCC_RUNTIME_SIDECAR_URL=http://127.0.0.1:8010")
      CCC_COMPONENT_CMD=(uv run uvicorn backend.app.main:create_app --factory --reload --host 127.0.0.1 --port 8000)
      ;;
    dev:vite)
      CCC_COMPONENT_PORT="4173"
      CCC_COMPONENT_HEALTH_URL="http://127.0.0.1:4173/"
      CCC_COMPONENT_TIMEOUT_SECONDS="60"
      CCC_COMPONENT_WORKDIR="${CCC_REPO_ROOT}/web"
      CCC_COMPONENT_CMD=(npm run dev -- --host 127.0.0.1 --port 4173)
      ;;
    served:sidecar)
      CCC_COMPONENT_PORT="8010"
      CCC_COMPONENT_HEALTH_URL="http://127.0.0.1:8010/healthz"
      CCC_COMPONENT_TIMEOUT_SECONDS="30"
      CCC_COMPONENT_WORKDIR="$CCC_REPO_ROOT"
      CCC_COMPONENT_CMD=(uv run uvicorn backend.sidecar.main:create_app --factory --host 127.0.0.1 --port 8010)
      ;;
    served:backend)
      CCC_COMPONENT_PORT="8000"
      CCC_COMPONENT_HEALTH_URL="http://127.0.0.1:8000/healthz/ui-artifact"
      CCC_COMPONENT_TIMEOUT_SECONDS="30"
      CCC_COMPONENT_WORKDIR="$CCC_REPO_ROOT"
      CCC_COMPONENT_ENV=("CCC_RUNTIME_SIDECAR_URL=http://127.0.0.1:8010")
      CCC_COMPONENT_CMD=(uv run uvicorn backend.app.main:create_app --factory --host 127.0.0.1 --port 8000)
      ;;
    e2e:sidecar)
      CCC_COMPONENT_PORT="8010"
      CCC_COMPONENT_HEALTH_URL="http://127.0.0.1:8010/healthz"
      CCC_COMPONENT_TIMEOUT_SECONDS="30"
      CCC_COMPONENT_WORKDIR="$CCC_REPO_ROOT"
      CCC_COMPONENT_ENV=(
        "CCC_RUNTIME_TRANSPORT=stdio"
        "CCC_RUNTIME_COMMAND=uv run python backend/tests/fake_stdio_app_server.py"
      )
      CCC_COMPONENT_CMD=(uv run uvicorn backend.sidecar.main:create_app --factory --host 127.0.0.1 --port 8010)
      ;;
    e2e:backend)
      CCC_COMPONENT_PORT="8000"
      CCC_COMPONENT_HEALTH_URL="http://127.0.0.1:8000/healthz/ui-artifact"
      CCC_COMPONENT_TIMEOUT_SECONDS="30"
      CCC_COMPONENT_WORKDIR="$CCC_REPO_ROOT"
      CCC_COMPONENT_ENV=(
        "CCC_RUNTIME_SIDECAR_URL=http://127.0.0.1:8010"
        "CCC_DATA_DIR=${CCC_E2E_DATA_DIR}"
        "CCC_DB_PATH=${CCC_E2E_DB_PATH}"
      )
      CCC_COMPONENT_CMD=(uv run uvicorn backend.app.main:create_app --factory --host 127.0.0.1 --port 8000)
      ;;
    *)
      ccc_die "unsupported component mapping: ${profile}:${component}"
      ;;
  esac
}
