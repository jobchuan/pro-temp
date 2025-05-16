# Vision Pro 沉浸式内容平台 - 后端服务

## 项目概述
这是一个完整的Vision Pro沉浸式内容平台的后端服务，支持多种VR/AR内容格式，包括180°/360°视频和照片、空间视频等。

## 功能特性
- ✅ 用户认证系统
- ✅ 内容上传和管理
- ✅ 评论、点赞和收藏功能
- ✅ 弹幕系统
- ✅ 协作编辑
- ✅ 支付和订阅系统
- ✅ 创作者收入分成
- ✅ 离线内容下载

## 开发环境要求
- Node.js 16.x+
- MongoDB 4.x+
- npm 或 yarn

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd vision-pro-backend
2. 安装依赖
bashnpm install
3. 配置环境变量
创建 .env 文件并添加以下配置：
# 基础配置
PORT=5001
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/visionpro

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d

# 语言配置
DEFAULT_LANGUAGE=zh-CN
SUPPORTED_LANGUAGES=zh-CN,en-US,ja-JP,ko-KR

# 支付配置（可选）
ALIPAY_APP_ID=your-alipay-app-id
ALIPAY_PRIVATE_KEY=your-alipay-private-key
ALIPAY_PUBLIC_KEY=your-alipay-public-key
ALIPAY_NOTIFY_URL=http://localhost:5001/api/payment/callback/alipay

WECHAT_APP_ID=your-wechat-app-id
WECHAT_MCH_ID=your-wechat-mch-id
WECHAT_PRIVATE_KEY=your-wechat-private-key
WECHAT_SERIAL=your-wechat-serial
WECHAT_API_KEY=your-wechat-api-key
WECHAT_NOTIFY_URL=http://localhost:5001/api/payment/callback/wechat

STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

APPLE_IAP_SHARED_SECRET=your-apple-shared-secret
APPLE_BUNDLE_ID=com.yourdomain.visionpro
4. 初始化数据库
bashnode scripts/initDb.js
5. 启动服务器
开发模式（自动重启）：
bashnpm run dev
生产模式：
bashnpm start
服务器将在 http://localhost:5001 运行。
API文档
认证接口

POST /api/users/register - 用户注册
POST /api/users/login - 用户登录
GET /api/users/me - 获取当前用户信息
PUT /api/users/profile - 更新用户资料
PUT /api/users/change-password - 修改密码

内容接口

GET /api/contents - 获取内容列表
POST /api/contents - 创建内容
GET /api/contents/:contentId - 获取内容详情
PUT /api/contents/:contentId - 更新内容
DELETE /api/contents/:contentId - 删除内容
GET /api/contents/user - 获取用户的内容列表

交互接口

POST /api/interactions/content/:contentId/like - 点赞/取消点赞
POST /api/interactions/content/:contentId/favorite - 收藏/取消收藏
GET /api/interactions/content/:contentId/status - 获取交互状态
POST /api/interactions/content/:contentId/comments - 添加评论
GET /api/interactions/content/:contentId/comments - 获取评论列表
DELETE /api/interactions/comments/:commentId - 删除评论
POST /api/interactions/content/:contentId/view - 记录观看历史
GET /api/interactions/history - 获取观看历史
GET /api/interactions/continue-watching - 获取继续观看列表
POST /api/interactions/content/:contentId/offline - 创建离线下载
GET /api/interactions/offline - 获取离线内容列表
POST /api/interactions/content/:contentId/danmaku - 发送弹幕
GET /api/interactions/content/:contentId/danmaku - 获取弹幕列表

上传接口

POST /api/upload/single - 单文件上传
POST /api/upload/multiple - 多文件上传
POST /api/upload/chunk/init - 初始化分片上传
POST /api/upload/chunk/upload - 上传分片
POST /api/upload/chunk/complete - 完成分片上传

支付接口

POST /api/payment/order/subscription - 创建订阅订单
POST /api/payment/order/content - 创建内容购买订单
POST /api/payment/apple/verify - 验证Apple内购收据
GET /api/payment/subscription - 获取用户订阅信息

测试账号
初始化数据库后，系统会自动创建以下测试账号：

管理员账号：

用户名：admin
邮箱：admin@example.com
密码：123456


创作者账号：

用户名：creator
邮箱：creator@example.com
密码：123456


普通用户账号：

用户名：user
邮箱：user@example.com
密码：123456



目录结构
vision-pro-backend/
├── config/                 # 配置文件
├── controllers/            # 控制器
├── locales/                # 本地化文件
├── middleware/             # 中间件
├── models/                 # 数据模型
├── routes/                 # 路由
├── scripts/                # 脚本工具
├── services/               # 服务层
├── uploads/                # 上传文件目录
├── utils/                  # 工具函数
├── .env                    # 环境变量
├── package.json            # 项目依赖
├── server.js               # 服务器入口
└── README.md               # 项目说明
部署
Docker部署

构建Docker镜像：

bashdocker build -t vision-pro-backend .

运行容器：

bashdocker run -p 5001:5001 -e MONGODB_URI=mongodb://host.docker.internal:27017/visionpro vision-pro-backend
问题排查
常见问题

连接数据库失败

确保MongoDB服务已启动
检查MONGODB_URI环境变量是否正确


上传文件失败

检查uploads目录是否存在并具有写入权限
确保文件大小不超过限制


支付功能不可用

检查相关支付平台的配置是否正确
开发环境下可能需要使用测试账号