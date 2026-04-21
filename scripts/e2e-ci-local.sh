#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="dive-demo-e2e-local"
TARGET="${1:-all}"
NODE_VERSION="$(cat "${ROOT_DIR}/.nvmrc")"
BUILD_IMAGE="${BUILD_IMAGE:-1}"
RUNNER_HOME="/home/runner"
RUNNER_REPO_DIR="/home/runner/work/dive-demo/dive-demo"
RUNNER_OS="Linux"
LOCK_HASH="$(shasum -a 256 "${ROOT_DIR}/yarn.lock" | awk '{ print $1 }')"
CACHE_ROOT="${CACHE_ROOT:-${TMPDIR:-/tmp}/dive-demo-gh-local-cache}"
KEEP_JOB_DIRS="${KEEP_JOB_DIRS:-0}"
CLEAN_LOCAL_GH_CACHE="${CLEAN_LOCAL_GH_CACHE:-0}"
# Use a roomier local default so the GH-like Docker repro reaches the flaky test
# path instead of failing earlier on slower local hosts. Override with
# PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS=180000 for strict GH timeout parity.
WEB_SERVER_TIMEOUT_MS="${PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS:-600000}"

NODE_MODULES_CACHE_DIR="${CACHE_ROOT}/node-modules-${RUNNER_OS}-${LOCK_HASH}"
PLAYWRIGHT_CACHE_DIR="${CACHE_ROOT}/playwright-browsers-${RUNNER_OS}-${LOCK_HASH}"
TEMP_ROOT="${TEMP_ROOT:-${TMPDIR:-/tmp}/dive-demo-gh-local-jobs}"
JOB_DIRS=()

cleanup() {
  if [[ "${KEEP_JOB_DIRS}" == "1" ]]; then
    return
  fi

  if [[ "${#JOB_DIRS[@]}" -eq 0 ]]; then
    return
  fi

  for job_dir in "${JOB_DIRS[@]}"; do
    rm -rf "${job_dir}"
  done
}

trap cleanup EXIT

build_image() {
  docker build \
    --platform linux/amd64 \
    --build-arg "NODE_VERSION=${NODE_VERSION}" \
    -f "${ROOT_DIR}/Dockerfile.e2e" \
    -t "${IMAGE_TAG}" \
    "${ROOT_DIR}"
}

prepare_cache_dirs() {
  if [[ "${CLEAN_LOCAL_GH_CACHE}" == "1" ]]; then
    rm -rf "${NODE_MODULES_CACHE_DIR}" "${PLAYWRIGHT_CACHE_DIR}"
  fi

  mkdir -p "${NODE_MODULES_CACHE_DIR}" "${PLAYWRIGHT_CACHE_DIR}" "${TEMP_ROOT}"
}

make_job_dir() {
  local job_name="$1"
  local job_dir

  job_dir="$(mktemp -d "${TEMP_ROOT}/${job_name}.XXXXXX")"
  JOB_DIRS+=("${job_dir}")

  rsync -a \
    --delete \
    --exclude '.git/' \
    --exclude 'node_modules/' \
    --exclude '.playwright-cache/' \
    --exclude 'dist/' \
    --exclude 'playwright-report/' \
    --exclude 'test-results/' \
    "${ROOT_DIR}/" "${job_dir}/"

  printf '%s\n' "${job_dir}"
}

run_in_runner() {
  local job_name="$1"
  local job_dir="$2"
  local command="$3"

  printf '\n[%s] starting in %s\n' "${job_name}" "${job_dir}"

  docker run --rm --init --platform linux/amd64 --shm-size=2g \
    -e "HOME=${RUNNER_HOME}" \
    -e "LANG=C.UTF-8" \
    -e "LC_ALL=C.UTF-8" \
    -e "TZ=Etc/UTC" \
    -e "PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS=${WEB_SERVER_TIMEOUT_MS}" \
    -v "${job_dir}:${RUNNER_REPO_DIR}" \
    -v "${NODE_MODULES_CACHE_DIR}:${RUNNER_REPO_DIR}/node_modules" \
    -v "${PLAYWRIGHT_CACHE_DIR}:${RUNNER_REPO_DIR}/.playwright-cache" \
    "${IMAGE_TAG}" \
    bash -lc "cd '${RUNNER_REPO_DIR}' && ${command}"
}

cache_has_content() {
  local dir="$1"
  find "${dir}" -mindepth 1 -maxdepth 1 | read -r _
}

run_yarn_install_job() {
  local job_dir
  job_dir="$(make_job_dir "yarn-install")"

  if cache_has_content "${NODE_MODULES_CACHE_DIR}"; then
    printf '[yarn-install] cache hit: %s\n' "${NODE_MODULES_CACHE_DIR}"
    return
  fi

  run_in_runner "yarn-install" "${job_dir}" "yarn install --frozen-lockfile"
}

run_build_job() {
  local job_dir
  job_dir="$(make_job_dir "build")"

  run_in_runner "build" "${job_dir}" "yarn build"
}

run_playwright_install_job() {
  local job_dir
  job_dir="$(make_job_dir "playwright-install")"

  if cache_has_content "${PLAYWRIGHT_CACHE_DIR}"; then
    printf '[playwright-install] cache hit: %s\n' "${PLAYWRIGHT_CACHE_DIR}"
    return
  fi

  run_in_runner \
    "playwright-install" \
    "${job_dir}" \
    "PLAYWRIGHT_BROWSERS_PATH=.playwright-cache yarn playwright install --with-deps"
}

run_e2e_shard_job() {
  local shard="$1"
  local safe_shard="${shard//\//-}"
  local job_dir

  job_dir="$(make_job_dir "e2e-${safe_shard}")"

  run_in_runner \
    "e2e ${shard}" \
    "${job_dir}" \
    "sudo apt-get --yes remove --purge man-db \
      && yarn playwright install-deps chromium firefox webkit \
      && node -e \"const fs = require('fs'); const demoPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')); const divePkg = JSON.parse(fs.readFileSync('./node_modules/@shopware-ag/dive/package.json', 'utf8')); console.log('Requested @shopware-ag/dive:', demoPkg.dependencies['@shopware-ag/dive']); console.log('Installed @shopware-ag/dive version:', divePkg.version);\" \
      && PLAYWRIGHT_BROWSERS_PATH=.playwright-cache CI=true LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe xvfb-run --auto-servernum yarn test:e2e --headed --shard=${shard}"
}

main() {
  prepare_cache_dirs

  if [[ "${BUILD_IMAGE}" == "1" ]]; then
    build_image
  fi

  run_yarn_install_job
  run_build_job
  run_playwright_install_job

  if [[ "${TARGET}" == "all" ]]; then
    run_e2e_shard_job "1/4"
    run_e2e_shard_job "2/4"
    run_e2e_shard_job "3/4"
    run_e2e_shard_job "4/4"
  else
    run_e2e_shard_job "${TARGET}"
  fi
}

main "$@"
