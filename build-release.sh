#!/usr/bin/env bash
# ============================================================
# 打包正式版 APK（Release）。
# 注意：release 包默认未签名，必须先用 keystore 签名后才能安装。
# 本脚本先产出未签名 APK；签名步骤见 build-android.md「4. 签名」。
# 产物：android/app/build/outputs/apk/release/app-release-unsigned.apk
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 同步 Web 资源..."
npx cap copy android

echo "==> 编译 Release APK（未签名）..."
cd android
if [ -f ./gradlew ]; then
  ./gradlew assembleRelease
else
  gradle assembleRelease
fi

echo ""
echo "==> 未签名 APK 路径："
echo "    android/app/build/outputs/apk/release/app-release-unsigned.apk"
echo "==> 请按 build-android.md 第 4 节生成 keystore 并签名后再安装。"
