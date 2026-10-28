#!/usr/bin/env bash
# ============================================================
# 打包调试版 APK（免签名、可直接安装到手机测试）
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 同步 Web 资源..."
npx cap copy android

echo "==> 编译调试 APK..."
cd android
if [ -f ./gradlew ]; then
  ./gradlew assembleDebug
else
  gradle assembleDebug
fi

echo ""
echo "==> 打包完成，APK 路径："
echo "    android/app/build/outputs/apk/debug/app-debug.apk"
