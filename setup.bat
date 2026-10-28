@echo off
REM ============================================================
REM 双色球选号助手 - 初始化 Capacitor 安卓工程（Windows）
REM 首次打包前运行一次：scripts\setup.bat
REM 前置环境：Node.js 18+、JDK 17、Android SDK（建议 Android Studio）
REM ============================================================
setlocal
cd /d "%~dp0\.."

echo ==^> 1/4 安装 npm 依赖...
call npm install
if errorlevel 1 goto :fail

echo ==^> 2/4 检查 / 初始化 android 原生工程...
if not exist "android" (
  call npx cap add android
) else (
  echo     android 目录已存在，跳过 add。
)

echo ==^> 3/4 同步 Web 资源与插件到原生工程...
call npx cap sync android
if errorlevel 1 goto :fail

echo ==^> 4/4 完成。
echo.
echo 下一步：
echo   - 调试 APK：scripts\build-debug.bat
echo   - 正式 APK：scripts\build-release.bat
echo   - Android Studio 打开：npx cap open android
goto :eof

:fail
echo 初始化失败，请查看上方报错。
exit /b 1
