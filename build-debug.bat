@echo off
REM 打包调试版 APK（免签名、可直接安装测试）
setlocal
cd /d "%~dp0\.."
echo ==^> 同步 Web 资源...
call npx cap copy android
echo ==^> 编译调试 APK...
cd android
if exist gradlew.bat (call gradlew.bat assembleDebug) else (gradle assembleDebug)
echo.
echo ==^> 打包完成：android\app\build\outputs\apk\debug\app-debug.apk
