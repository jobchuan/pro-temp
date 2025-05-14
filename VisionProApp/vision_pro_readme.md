# Vision Pro App 开发指南

## 项目概述
这是一个完整的Vision Pro沉浸式内容平台应用，支持多种VR/AR内容格式，包括180°/360°视频和照片、空间视频等。

## 功能特性
- ✅ 多种内容格式支持（180°/360°视频、空间视频等）
- ✅ 用户认证系统
- ✅ 内容上传和管理
- ✅ Apple内购支付
- ✅ 多语言支持
- ✅ 沉浸式播放体验
- ✅ 手势交互

## 开发环境要求
- macOS 14.0+
- Xcode 15.0+
- visionOS SDK
- Swift 5.9+

## 项目设置

### 1. 创建新项目
1. 打开Xcode
2. 选择 File -> New -> Project
3. 选择 visionOS -> App
4. 配置项目信息：
   - Product Name: VisionProApp
   - Organization Identifier: com.yourdomain
   - Interface: SwiftUI
   - Language: Swift
   - Initial Scene: Window

### 2. 添加必要的框架
在项目中添加以下框架：
- RealityKit
- ARKit
- AVFoundation
- StoreKit

### 3. 配置项目权限
在 Info.plist 中添加：
```xml
<key>NSCameraUsageDescription</key>
<string>需要相机权限来拍摄空间视频</string>
<key>NSMicrophoneUsageDescription</key>
<string>需要麦克风权限来录制音频</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要位置权限来标记内容位置</string>
```

### 4. 配置网络权限
在 Info.plist 中添加：
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## 文件结构说明

### Models/
- `User.swift`: 用户数据模型
- `Content.swift`: 内容数据模型
- `Subscription.swift`: 订阅数据模型
- `Order.swift`: 订单数据模型

### Views/
- `ContentView.swift`: 主界面
- `Auth/`: 认证相关视图
- `Content/`: 内容展示视图
- `Immersive/`: 沉浸式体验视图
- `Subscription/`: 订阅相关视图

### Services/
- `NetworkManager.swift`: 网络请求管理
- `AuthService.swift`: 认证服务
- `ContentService.swift`: 内容服务
- `IAPManager.swift`: 内购管理

## 核心功能实现

### 1. 网络配置
在 `VisionProApp.swift` 中配置网络管理器：
```swift
NetworkManager.shared.configure(baseURL: "http://localhost:5001/api")
```

### 2. 用户认证
使用 `AuthService` 处理登录注册：
```swift
try await authService.login(email: email, password: password)
```

### 3. 内容加载
使用 `ContentService` 加载内容：
```swift
let contents = try await contentService.fetchContents(for: selectedTab)
```

### 4. 沉浸式播放
使用 `ImmersiveVideoPlayer` 播放视频：
```swift
ImmersiveVideoPlayer(content: content)
```

## 本地化支持

### 1. 创建本地化文件
- 创建 `Localizable.strings` 文件
- 支持语言：中文(zh-CN)、英文(en-US)、日文(ja-JP)、韩文(ko-KR)

### 2. 使用本地化字符串
```swift
Text("welcome_message".localized)
```

## 测试说明

### 1. 模拟器测试
- 使用visionOS模拟器进行基础功能测试
- 测试UI布局和交互

### 2. 设备测试
- 在Vision Pro设备上测试沉浸式体验
- 测试手势识别和眼动追踪
- 测试空间音频

### 3. 网络测试
- 确保后端服务运行在 localhost:5001
- 测试所有API接口

## 发布准备

### 1. 配置App Store Connect
- 创建App ID
- 配置内购产品
- 设置订阅计划

### 2. 生成证书
- 开发证书
- 发布证书
- 推送证书（如需要）

### 3. 提交审核
- 准备应用截图
- 编写应用描述
- 提交TestFlight测试

## 注意事项

1. **性能优化**
   - 优化3D模型加载
   - 使用异步加载
   - 管理内存使用

2. **用户体验**
   - 适配不同的沉浸式级别
   - 提供舒适的交互方式
   - 避免晕动症

3. **安全性**
   - 所有API请求使用HTTPS（生产环境）
   - 安全存储用户凭证
   - 验证内购收据

## 故障排除

### 常见问题

1. **网络连接失败**
   - 检查后端服务是否运行
   - 检查网络权限配置
   - 验证API地址是否正确

2. **内购无法使用**
   - 检查StoreKit配置
   - 验证产品ID是否匹配
   - 确保沙盒账号正确

3. **视频播放问题**
   - 检查视频格式兼容性
   - 验证URL是否有效
   - 检查音频会话配置

## 更新日志

### v1.0.0
- 初始版本发布
- 基础功能实现
- 支持Apple内购

## 联系方式
如有问题，请联系开发团队。
