# Vision Pro App 项目结构

```
VisionProApp/
├── VisionProApp.xcodeproj
├── VisionProApp/
│   ├── VisionProApp.swift              # 应用入口
│   ├── ContentView.swift               # 主视图
│   ├── Info.plist
│   │
│   ├── Models/                         # 数据模型
│   │   ├── User.swift
│   │   ├── Content.swift
│   │   ├── Subscription.swift
│   │   └── Collaboration.swift
│   │
│   ├── Views/                          # 视图
│   │   ├── Auth/
│   │   │   ├── LoginView.swift
│   │   │   ├── RegisterView.swift
│   │   │   └── ProfileView.swift
│   │   │
│   │   ├── Content/
│   │   │   ├── ContentListView.swift
│   │   │   ├── ContentDetailView.swift
│   │   │   ├── ContentPlayerView.swift
│   │   │   └── UploadView.swift
│   │   │
│   │   ├── Immersive/
│   │   │   ├── ImmersiveVideoPlayer.swift
│   │   │   ├── Immersive360PhotoViewer.swift
│   │   │   └── SpatialMediaViewer.swift
│   │   │
│   │   ├── Subscription/
│   │   │   ├── SubscriptionView.swift
│   │   │   └── PaymentView.swift
│   │   │
│   │   └── Components/
│   │       ├── VideoThumbnail.swift
│   │       ├── LoadingView.swift
│   │       └── ErrorView.swift
│   │
│   ├── Services/                       # 服务层
│   │   ├── NetworkManager.swift
│   │   ├── AuthService.swift
│   │   ├── ContentService.swift
│   │   ├── PaymentService.swift
│   │   └── IAPManager.swift
│   │
│   ├── Utils/                          # 工具类
│   │   ├── Constants.swift
│   │   ├── Extensions.swift
│   │   └── LocalizationManager.swift
│   │
│   ├── Resources/                      # 资源文件
│   │   ├── Localizable.strings
│   │   ├── Assets.xcassets
│   │   └── Sounds/
│   │
│   └── RealityKitContent/             # RealityKit内容
│       ├── RealityKitContent.rkproject
│       └── Package.swift
│
├── VisionProAppTests/
└── VisionProAppUITests/
```
