# 打包成可安装安卓 APK 完整步骤（Capacitor 6）

本工程把前面的 H5 选号页面套成一个原生安卓 APP。打包后运行在原生 WebView 里，
开启了 **CapacitorHttp**，全局 `fetch` 走安卓原生网络层，**自动绕开浏览器跨域(CORS)限制**，
因此「从福彩官网在线拉取历史开奖」在 APK 内可以直接工作。

> 本 APP 仅用于选号与参数参考，**不登录、不下注、不付款**。购彩请走线下福彩实体站点。

---

## 0. 你需要先准备的电脑环境（只装一次）

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | 18 或以上 | 官网下载 LTS 版，装完命令行输入 `node -v` 能看到版本号 |
| JDK | **17**（必须 17，11/21 可能报错） | 装 Android Studio 会自带 JBR 17，一般不用单独装 |
| Android Studio | 最新稳定版 | 自带 Android SDK、SDK Platform 34、Gradle；新手最省事 |
| 网络 | 能访问 npm 和 Google Maven | 国内若 Gradle 下载慢，可按文末「国内镜像」配置 |

**最简单路径**：直接安装 Android Studio（自带 JDK 17 + SDK + Gradle），再装 Node.js，即可开始。

安装 Android Studio 后，首次启动让它自动下载 SDK；在 `Settings → Appearance & Behavior → System Settings → Android SDK`
里确认已勾选 **Android SDK Platform 34**。

---

## 1. 工程目录说明

```
ssq-apk-project/
├── package.json            依赖与脚本
├── capacitor.config.json   APP 配置（应用名、包名、CapacitorHttp 开启）
├── www/                    H5 页面（index.html / style.css / app.js）
└── scripts/
    ├── setup.sh / setup.bat        一键初始化（首次运行）
    ├── build-debug.sh / .bat       打调试 APK（可直接安装）
    └── build-release.sh / .bat     打正式未签名 APK
```

- **应用包名**：`com.ssq.picker`（在 `capacitor.config.json` 里，可改）
- **应用名称**：`双色球选号助手`（同上可改）

---

## 2. 第一步：初始化工程（只做一次）

### Windows
打开命令行（CMD 或 PowerShell），进入工程目录，依次执行：

```bat
scripts\setup.bat
```

### macOS / Linux
```bash
bash scripts/setup.sh
```

脚本自动完成：
1. `npm install` 安装 Capacitor 核心与安卓平台；
2. `npx cap add android` 生成安卓原生工程目录 `android/`；
3. `npx cap sync android` 把 `www/` 页面和插件同步进原生工程。

> 如果 `android` 目录已经存在，脚本会跳过 `add`，只做同步。

---

## 3. 第二步：打调试版 APK（先跑通这个，免签名直接装手机）

### Windows
```bat
scripts\build-debug.bat
```
### macOS / Linux
```bash
bash scripts/build-debug.sh
```

编译完成后，APK 在：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

把这个文件传到安卓手机，点击安装即可（手机需开启「允许安装未知来源应用」）。
调试版用的是 Android 自动调试签名，能直接安装，适合自测。

---

## 4. 第三步：正式版 Release APK 与签名（可选，长期使用建议做）

### 4.1 先编译未签名 Release 包
### Windows
```bat
scripts\build-release.bat
```
### macOS / Linux
```bash
bash scripts/build-release.sh
```

产物：`android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 4.2 生成签名密钥（keystore，只做一次，务必保存好）
在工程根目录执行（Windows 把 `./` 去掉、命令在 CMD 下直接运行）：

```bash
keytool -genkey -v -keystore ssq-picker.keystore -alias ssqkey -keyalg RSA -keysize 2048 -validity 10000
```

按提示设置密钥库密码、密码、姓名组织信息等。生成的 `ssq-picker.keystore` 要长期保存，
**丢失后将无法给同一应用升级版本**。

### 4.3 给 Release APK 签名（zipalign 对齐 + 签名）

先对齐：
```bash
# 路径里的 SDK 版本号按本机实际为准（build-tools/34.0.0）
$ANDROID_HOME/build-tools/34.0.0/zipalign -v 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  app-release-aligned.apk
```

再签名：
```bash
$ANDROID_HOME/build-tools/34.0.0/apksigner sign \
  --ks ssq-picker.keystore \
  --ks-key-alias ssqkey \
  --out app-release-signed.apk \
  app-release-aligned.apk
```

验证签名成功：
```bash
$ANDROID_HOME/build-tools/34.0.0/apksigner verify --print-certs app-release-signed.apk
```

最终可安装文件：**`app-release-signed.apk`**。

> 不想手动签名，也可以在 Android Studio 里：`Build → Generate Signed App Bundle / APK`，
> 按界面向导选 keystore、填密码，直接导出签名 APK，图形化操作更直观。

---

## 5. 以后改了页面怎么重新打包

只要修改 `www/` 里的 `index.html / style.css / app.js`，然后：

```bash
npx cap copy android
bash scripts/build-debug.sh        # 或 build-release.sh
```

`cap copy` 会把最新页面拷进原生工程，再编译即可。

---

## 5.5 更换应用图标和名称

- **应用名称**：改 `capacitor.config.json` 里的 `appName`，重新执行 `npx cap sync android`，
  会同步更新 `android/app/src/main/res/values/strings.xml`。
- **应用图标**：默认是 Capacitor 模板图标。替换方式（推荐）：
  1. 准备一张 512×512 以上 PNG；
  2. Android Studio 打开工程 → 右键 `app → New → Image Asset`；
  3. 选择图标图，自动生成各分辨率 `mipmap/ic_launcher` 后重新编译。
- 也可用命令行工具 [@capacitor/assets](https://github.com/ionic-team/capacitor-assets) 一键生成各尺寸。

---

## 6. 常见问题

### Q1：在线拉取历史开奖失败 / 跨域报错
APK 里已开启 `CapacitorHttp.enabled = true`（见 `capacitor.config.json`），正常不会有跨域问题。
若仍失败，检查：
- 手机是否联网；
- `android/AndroidManifest.xml` 是否有 `<uses-permission android:name="android.permission.INTERNET" />`
  （Capacitor 默认会加，被删掉就手动补到 `<manifest>` 内）；
- 福彩官网接口临时维护，稍后重试。

### Q2：`cap add android` 或 Gradle 下载依赖很慢 / 卡住
国内配置 Maven 镜像：编辑 `android/build.gradle`（或 `android/settings.gradle`），
把仓库换成阿里云镜像后重新 `npx cap sync android`。

### Q3：JDK 版本报错（如 Unsupported class file major version）
确认 Android Studio 自带的 JBR 17 被使用。命令行可设置：
```bash
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home   # macOS
# Windows 示例：set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
```

### Q4：能不能直接在这台云端环境编译出 APK？
不能。编译安卓 APK 必须要有 Android SDK + Gradle 构建环境，本工程提供的是**可在你自己电脑上一键构建**的完整工程和脚本。

### Q5：debug 包和 release 包区别
- debug：自动调试签名、体积略大、带调试信息，供自己手机测试；
- release：需自己签名、体积更小、可长期分发安装。

---

## 7. 法律与理性提示
- 接口数据来自中国福彩网公开开奖公告，仅读取历史号码用于走势参考；
- 彩票开奖独立随机，任何参数、冷热统计都**不构成中奖预测**；
- 本 APP 不接入任何购彩、充值、支付功能，请理性购彩、量力而行。
