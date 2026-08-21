#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_DIR="${SOURCE_DIR:-/opt/1panel/www/Plum}"
WEB_DIR="${WEB_DIR:-/opt/1panel/www/sites/plum.xinlioa.com/index}"
BRANCH="${BRANCH:-}"
SKIP_PULL="${SKIP_PULL:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"
NODE_MAJOR="${NODE_MAJOR:-22}"

log() {
  printf '\033[1;34m[deploy-client]\033[0m %s\n' "$*"
}

fail() {
  printf '\033[1;31m[deploy-client] ERROR:\033[0m %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少命令: $1"
}

as_root() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    fail "需要 root 权限安装 Node.js，但当前用户不是 root 且系统没有 sudo"
  fi
}

ensure_curl() {
  if command -v curl >/dev/null 2>&1; then
    return
  fi

  log "未检测到 curl，尝试安装 curl"
  if command -v apt-get >/dev/null 2>&1; then
    as_root apt-get update
    as_root apt-get install -y curl ca-certificates gnupg
  elif command -v dnf >/dev/null 2>&1; then
    as_root dnf install -y curl ca-certificates
  elif command -v yum >/dev/null 2>&1; then
    as_root yum install -y curl ca-certificates
  else
    fail "无法自动安装 curl，请先手动安装 curl 后重试"
  fi
}

install_nodejs() {
  log "未检测到 Node.js/npm，开始安装 Node.js ${NODE_MAJOR}.x"
  ensure_curl

  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | as_root bash -
    as_root apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | as_root bash -
    as_root dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | as_root bash -
    as_root yum install -y nodejs
  else
    fail "不支持的系统包管理器，请手动安装 Node.js ${NODE_MAJOR}.x 和 npm"
  fi
}

ensure_nodejs() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    install_nodejs
  fi

  command -v node >/dev/null 2>&1 || fail "Node.js 安装后仍不可用"
  command -v npm >/dev/null 2>&1 || fail "npm 安装后仍不可用"
  log "Node.js 版本: $(node -v)"
  log "npm 版本: $(npm -v)"
}

require_cmd git
require_cmd rsync
ensure_nodejs

[[ -d "$SOURCE_DIR/.git" ]] || fail "源码目录不存在或不是 Git 仓库: $SOURCE_DIR"
[[ -d "$SOURCE_DIR/client" ]] || fail "客户端目录不存在: $SOURCE_DIR/client"
mkdir -p "$WEB_DIR"
[[ -d "$WEB_DIR" ]] || fail "网站目录不存在且无法创建: $WEB_DIR"

log "源码目录: $SOURCE_DIR"
log "网站目录: $WEB_DIR"

cd "$SOURCE_DIR"

if [[ "$SKIP_PULL" != "1" ]]; then
  if [[ -n "$BRANCH" ]]; then
    log "切换/更新分支: $BRANCH"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull --ff-only origin "$BRANCH"
  else
    current_branch="$(git rev-parse --abbrev-ref HEAD)"
    log "更新当前分支: $current_branch"
    git pull --ff-only
  fi
else
  log "跳过 git pull"
fi

cd "$SOURCE_DIR/client"

if [[ "$SKIP_INSTALL" != "1" ]]; then
  if [[ -f package-lock.json ]]; then
    log "安装/校验前端依赖: npm ci"
    npm ci
  else
    log "安装前端依赖: npm install"
    npm install
  fi
else
  log "跳过依赖安装"
fi

log "构建前端静态文件"
npm run build

[[ -f "$SOURCE_DIR/client/dist/index.html" ]] || fail "构建失败，未找到 dist/index.html"
[[ -d "$SOURCE_DIR/client/dist/assets" ]] || fail "构建失败，未找到 dist/assets"

log "同步 dist/ 到网站目录"
rsync -av --delete "$SOURCE_DIR/client/dist/" "$WEB_DIR/"

log "部署完成"
log "如页面未更新，请清理浏览器/CDN 缓存后重试"
