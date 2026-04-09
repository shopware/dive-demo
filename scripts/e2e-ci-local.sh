#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="dive-demo-e2e-local"
TARGET="${1:-all}"
NODE_VERSION="$(cat "${ROOT_DIR}/.nvmrc")"
BUILD_IMAGE="${BUILD_IMAGE:-1}"
RUNNER_REPO_DIR="/home/runner/work/dive-demo/dive-demo"
# GitHub uses 180s here. Local linux/amd64 Docker on macOS is materially slower,
# so we allow an override and default to a higher value for reproducible local CI repros.
WEB_SERVER_TIMEOUT_MS="${PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS:-600000}"

if [[ "${BUILD_IMAGE}" == "1" ]]; then
  docker build \
    --platform linux/amd64 \
    --build-arg "NODE_VERSION=${NODE_VERSION}" \
    -f "${ROOT_DIR}/Dockerfile.e2e" \
    -t "${IMAGE_TAG}" \
    "${ROOT_DIR}"
fi

run_shard() {
  local shard="$1"

  docker run --rm --init --platform linux/amd64 --shm-size=2g "${IMAGE_TAG}" \
    bash -lc "cd '${RUNNER_REPO_DIR}' \
      && PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS='${WEB_SERVER_TIMEOUT_MS}' PLAYWRIGHT_BROWSERS_PATH=.playwright-cache CI=true LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe HOME=/home/runner xvfb-run --auto-servernum yarn test:e2e --headed --shard=${shard}"
}

if [[ "${TARGET}" == "all" ]]; then
  run_shard "1/4"
  run_shard "2/4"
  run_shard "3/4"
  run_shard "4/4"
else
  run_shard "${TARGET}"
fi
