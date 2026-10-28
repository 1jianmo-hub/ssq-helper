# 双色球选号助手 · 安卓 APK 工程（Capacitor 6）

把 H5 选号页面打包成可安装的安卓 APK。APK 内开启原生 HTTP，可直接从福彩官网公开公告接口
在线拉取历史开奖，自动绕开浏览器跨域限制。**仅选号参考，不登录、不下注、不付款。**

## 快速开始
1. 装好 Node.js 18+ 和 Android Studio（自带 JDK 17 与 Android SDK）。
2. 初始化：
   - Windows：`scripts\setup.bat`
   - macOS/Linux：`bash scripts/setup.sh`
3. 打调试 APK：
   - Windows：`scripts\build-debug.bat`
   - macOS/Linux：`bash scripts/build-debug.sh`
4. 产物：`android/app/build/outputs/apk/debug/app-debug.apk`，传到手机安装。

**完整图文步骤、Release 签名、国内镜像、常见报错 → 见 [build-android.md](./build-android.md)**

## 目录
```
www/                      前端页面（与 H5 版一致）
package.json              依赖和打包脚本
capacitor.config.json     应用名 / 包名 / CapacitorHttp 配置
scripts/                  初始化与打包脚本（sh + bat）
build-android.md          手把手打包与签名文档
```

## 关键配置（capacitor.config.json）
- `webDir: "www"`：前端静态资源目录
- `plugins.CapacitorHttp.enabled: true`：fetch/XHR 走原生 HTTP，绕过 WebView CORS
- `appId: com.ssq.picker`、`appName: 双色球选号助手`：可按需修改

## 提示
- 修改页面只需编辑 `www/`，再执行 `npx cap copy android` 后重新编译。
- 若不想折腾命令行，可直接用 Android Studio：`npx cap open android`，在 IDE 里点 Build 出包。
