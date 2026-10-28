#!/usr/bin/env bash
# ============================================================
# 双色球选号助手 - 初始化 Capacitor 安卓工程（Linux / macOS）
# 首次打包前运行一次：bash scripts/setup.sh
# 前置环境：Node.js 18+、JDK 17、Android SDK（建议 Android Studio）
# ============================================================
set -euo pipefail

# 切到工程根目录（本脚本在 scripts/ 下）
cd "$(dirname "$0")/.."

echo "==> 1/4 安装 npm 依赖..."
npm install

echo "==> 2/4 检查 / 初始化 android 原生工程..."
if [ ! -d "android" ]; then
  npx cap add android
else
  echo "    android 目录已存在，跳过 add。"
fi

echo "==> 3/4 同步 Web 资源与插件到原生工程..."
npx cap sync android

echo "==> 4/4 完成。"
echo ""
echo "下一步："
echo "  - 调试 APK：bash scripts/build-debug.sh"
echo "  - 正式 APK：bash scripts/build-release.sh"
echo "  - 用 Android Studio 打开：npx cap open android"
