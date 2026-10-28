@echo off
REM 打包正式版 Release APK（未签名，签名步骤见 build-android.md 第 4 节）
setlocal
cd /d "%~dp0\.."
echo ==^> 同步 Web 资源...
call npx cap copy android
echo ==^> 编译 Release APK（未签名）...
cd android
if exist gradlew.bat (call gradlew.bat assembleRelease) else (gradle assembleRelease)
echo.
echo ==^> 未签名 APK：android\app\build\outputs\apk\release\app-release-unsigned.apk
echo ==^> 请按 build-android.md 第 4 节签名后再安装。
