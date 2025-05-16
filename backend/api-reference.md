# Vision Pro Platform API Reference Documentation
# Vision Pro 平台 API 参考文档

## Table of Contents | 目录
- [Authentication | 认证](#authentication--认证)
- [User Management | 用户管理](#user-management--用户管理)
- [Content Management | 内容管理](#content-management--内容管理)
- [Interaction Management | 互动管理](#interaction-management--互动管理)
- [Upload Management | 上传管理](#upload-management--上传管理)
- [Payment Management | 支付管理](#payment-management--支付管理)
- [Collaboration Management | 协作管理](#collaboration-management--协作管理)
- [Creator Dashboard | 创作者仪表盘](#creator-dashboard--创作者仪表盘)
- [Media Management | 媒体管理](#media-management--媒体管理)
- [Fusion Content | 融合内容](#fusion-content--融合内容)
- [Recommendation | 内容推荐](#recommendation--内容推荐)
- [Admin Dashboard | 管理员仪表盘](#admin-dashboard--管理员仪表盘)

## Base URL | 基础 URL
```
https://api.example.com/api
```

## Authentication | 认证

All authenticated requests must include an `Authorization` header with the JWT token.

所有需要认证的请求必须在请求头中包含 `Authorization` 字段和JWT令牌。

```
Authorization: Bearer {token}
```

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| `POST` | `/users/register` | Register a new user<br>注册新用户 | No | ```{ "username": "string", "email": "string", "password": "string", "preferredLanguage": "string" }``` | ```{ "success": true, "message": "string", "data": { "user": {}, "token": "string" } }``` |
| `POST` | `/users/login` | Login with email and password<br>使用邮箱和密码登录 | No | ```{ "email": "string", "password": "string" }``` | ```{ "success": true, "message": "string", "data": { "user": {}, "token": "string" } }``` |

## User Management | 用户管理

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| `GET` | `/users/me` | Get current user information<br>获取当前用户信息 | Yes | N/A | ```{ "success": true, "data": { "user": {}, "profile": {} } }``` |
| `PUT` | `/users/profile` | Update user profile<br>更新用户资料 | Yes | ```{ "displayName": "string", "bio": "string", "preferredLanguage": "string" }``` | ```{ "success": true, "message": "string", "data": { "user": {}, "profile": {} } }``` |
| `PUT` | `/users/change-password` | Change user password<br>修改用户密码 | Yes | ```{ "currentPassword": "string", "newPassword": "string" }``` | ```{ "success": true, "message": "string", "data": { "message": "string" } }``` |

## Content Management | 内容管理

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `GET` | `/contents` | Get public content list<br>获取公开内容列表 | No | Query: `page`, `limit`, `status`, `contentType`, `category` | ```{ "success": true, "data": [...], "pagination": {...} }``` |
| `POST` | `/contents` | Create new content<br>创建新内容 | Yes | ```{ "title": { "zh-CN": "string", "en-US": "string" }, "description": {...}, "contentType": "string", "files": {...}, "tags": [...], "category": "string", "pricing": {...}, "isCollaborative": boolean }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `GET` | `/contents/user` | Get user's content list<br>获取用户内容列表 | Yes | Query: `page`, `limit`, `status`, `contentType` | ```{ "success": true, "data": [...], "pagination": {...} }``` |
| `GET` | `/contents/:contentId` | Get content details<br>获取内容详情 | Yes | Path: `contentId` | ```{ "success": true, "data": {...} }``` |
| `PUT` | `/contents/:contentId` | Update content<br>更新内容 | Yes | Path: `contentId`<br>Body: ```{ ... }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `DELETE` | `/contents/:contentId` | Delete content (archive)<br>删除内容（归档） | Yes | Path: `contentId` | ```{ "success": true, "message": "string", "data": { "contentId": "string" } }``` |

## Interaction Management | 互动管理

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `POST` | `/interactions/content/:contentId/like` | Like/unlike content<br>点赞/取消点赞内容 | Yes | Path: `contentId` | ```{ "success": true, "data": { "liked": boolean, "contentId": "string" } }``` |
| `POST` | `/interactions/content/:contentId/favorite` | Favorite/unfavorite content<br>收藏/取消收藏内容 | Yes | Path: `contentId` | ```{ "success": true, "data": { "favorited": boolean, "contentId": "string" } }``` |
| `GET` | `/interactions/content/:contentId/status` | Get interaction status<br>获取互动状态 | Yes | Path: `contentId` | ```{ "success": true, "data": { "liked": boolean, "favorited": boolean } }``` |
| `POST` | `/interactions/content/:contentId/comments` | Add comment to content<br>添加评论 | Yes | Path: `contentId`<br>Body: ```{ "text": "string", "parentId": "string", "spatialAnchor": {} }``` | ```{ "success": true, "data": {...} }``` |
| `GET` | `/interactions/content/:contentId/comments` | Get content comments<br>获取内容评论 | No | Path: `contentId`<br>Query: `page`, `limit`, `sort` | ```{ "success": true, "data": { "comments": [...], "pagination": {...} } }``` |
| `DELETE` | `/interactions/comments/:commentId` | Delete comment<br>删除评论 | Yes | Path: `commentId` | ```{ "success": true, "message": "string" }``` |
| `POST` | `/interactions/content/:contentId/view` | Record view history<br>记录观看历史 | Yes | Path: `contentId`<br>Body: ```{ "progress": number, "duration": number }``` | ```{ "success": true, "data": {...} }``` |
| `GET` | `/interactions/history` | Get user view history<br>获取用户观看历史 | Yes | Query: `page`, `limit` | ```{ "success": true, "data": { "history": [...], "pagination": {...} } }``` |
| `GET` | `/interactions/continue-watching` | Get continue watching list<br>获取继续观看列表 | Yes | Query: `limit` | ```{ "success": true, "data": [...] }``` |
| `POST` | `/interactions/content/:contentId/offline` | Create offline download<br>创建离线下载 | Yes | Path: `contentId`<br>Body: ```{ "quality": "string" }``` | ```{ "success": true, "data": {...} }``` |
| `GET` | `/interactions/offline` | Get offline content list<br>获取离线内容列表 | Yes | Query: `page`, `limit`, `status` | ```{ "success": true, "data": { "content": [...], "pagination": {...} } }``` |
| `POST` | `/interactions/content/:contentId/danmaku` | Send danmaku (bullet comment)<br>发送弹幕 | Yes | Path: `contentId`<br>Body: ```{ "text": "string", "timestamp": number, "type": "string", "style": {}, "spatialPosition": {} }``` | ```{ "success": true, "data": {...} }``` |
| `GET` | `/interactions/content/:contentId/danmaku` | Get danmaku list<br>获取弹幕列表 | No | Path: `contentId`<br>Query: `startTime`, `endTime`, `limit` | ```{ "success": true, "data": [...] }``` |
| `GET` | `/interactions/content/:contentId/danmaku/density` | Get danmaku density<br>获取弹幕密度 | No | Path: `contentId`<br>Query: `interval` | ```{ "success": true, "data": [...] }``` |

## Upload Management | 上传管理

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `POST` | `/upload/single` | Upload single file<br>上传单个文件 | Yes | Form: `file` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `POST` | `/upload/multiple` | Upload multiple files<br>上传多个文件 | Yes | Form: `files` | ```{ "success": true, "message": "string", "data": [...] }``` |
| `POST` | `/upload/chunk/init` | Initialize chunk upload<br>初始化分片上传 | Yes | ```{ "fileName": "string", "fileSize": number, "chunkSize": number, "totalChunks": number }``` | ```{ "success": true, "data": { "identifier": "string", "chunkSize": number, "totalChunks": number } }``` |
| `POST` | `/upload/chunk/upload` | Upload file chunk<br>上传文件分片 | Yes | Form: `chunk`, `identifier`, `chunkNumber` | ```{ "success": true, "data": { "chunkNumber": number, "uploadedChunks": number, "totalChunks": number, "progress": string } }``` |
| `POST` | `/upload/chunk/complete` | Complete chunk upload<br>完成分片上传 | Yes | ```{ "identifier": "string" }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `DELETE` | `/upload/chunk/:identifier` | Cancel upload<br>取消上传 | Yes | Path: `identifier` | ```{ "success": true, "message": "string" }``` |
| `GET` | `/upload/chunk/:identifier/progress` | Get upload progress<br>获取上传进度 | Yes | Path: `identifier` | ```{ "success": true, "data": { "uploadedChunks": number, "totalChunks": number, "progress": string, "elapsedTime": number, "uploadSpeed": number, "estimatedTimeRemaining": number } }``` |

## Payment Management | 支付管理

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `POST` | `/payment/order/subscription` | Create subscription order<br>创建订阅订单 | Yes | ```{ "planId": "string", "paymentMethod": "string" }``` | ```{ "success": true, "data": { "orderNo": "string", "amount": number, "paymentParams": {...} } }``` |
| `POST` | `/payment/order/content` | Create content purchase order<br>创建内容购买订单 | Yes | ```{ "contentId": "string", "paymentMethod": "string" }``` | ```{ "success": true, "data": { "orderNo": "string", "amount": number, "paymentParams": {...} } }``` |
| `POST` | `/payment/order/tip` | Create tip order<br>创建打赏订单 | Yes | ```{ "creatorId": "string", "amount": number, "paymentMethod": "string" }``` | ```{ "success": true, "data": { "orderNo": "string", "amount": number, "paymentParams": {...} } }``` |
| `POST` | `/payment/callback/alipay` | Alipay payment callback<br>支付宝支付回调 | No | Alipay notification payload | `success` or `fail` |
| `POST` | `/payment/callback/wechat` | WeChat payment callback<br>微信支付回调 | No | WeChat notification payload | ```{ "code": "string", "message": "string" }``` |
| `POST` | `/payment/callback/stripe` | Stripe payment callback<br>Stripe支付回调 | No | Stripe webhook payload | ```{ "received": true }``` |
| `POST` | `/payment/callback/apple` | Apple subscription notification<br>苹果订阅通知 | No | Apple notification payload | HTTP 200 OK |
| `POST` | `/payment/apple/verify` | Verify Apple IAP receipt<br>验证苹果内购收据 | Yes | ```{ "receiptData": "string", "productId": "string" }``` | ```{ "success": true, "data": {...} }``` |
| `POST` | `/payment/apple/restore` | Restore Apple IAP purchases<br>恢复苹果内购 | Yes | ```{ "receiptData": "string" }``` | ```{ "success": true, "data": {...} }``` |
| `GET` | `/payment/order/:orderNo` | Query order status<br>查询订单状态 | Yes | Path: `orderNo` | ```{ "success": true, "data": { "orderNo": "string", "status": "string", "amount": number, "paidAt": "string" } }``` |
| `GET` | `/payment/orders` | Get user orders<br>获取用户订单 | Yes | Query: `page`, `limit`, `orderType`, `status` | ```{ "success": true, "data": { "orders": [...], "pagination": {...} } }``` |
| `GET` | `/payment/subscription` | Get user subscription<br>获取用户订阅 | Yes | N/A | ```{ "success": true, "data": { "hasSubscription": boolean, "subscription": {...} } }``` |
| `POST` | `/payment/subscription/cancel` | Cancel subscription<br>取消订阅 | Yes | N/A | ```{ "success": true, "message": "string", "data": { "endDate": "string" } }``` |

## Collaboration Management | 协作管理

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `POST` | `/collaborations/content/:contentId/invite` | Invite collaborator<br>邀请协作者 | Yes | Path: `contentId`<br>Body: ```{ "userId": "string", "role": "string", "permissions": {...} }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `POST` | `/collaborations/:collaborationId/accept` | Accept collaboration invitation<br>接受协作邀请 | Yes | Path: `collaborationId` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `POST` | `/collaborations/:collaborationId/decline` | Decline collaboration invitation<br>拒绝协作邀请 | Yes | Path: `collaborationId` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `GET` | `/collaborations/:collaborationId` | Get collaboration details<br>获取协作详情 | Yes | Path: `collaborationId` | ```{ "success": true, "data": {...} }``` |
| `PUT` | `/collaborations/:collaborationId/collaborator/:collaboratorId/permissions` | Update collaborator permissions<br>更新协作者权限 | Yes | Path: `collaborationId`, `collaboratorId`<br>Body: ```{ "permissions": {...} }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `DELETE` | `/collaborations/:collaborationId/collaborator/:collaboratorId` | Remove collaborator<br>移除协作者 | Yes | Path: `collaborationId`, `collaboratorId` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `GET` | `/collaborations/user/list` | Get user's collaborations<br>获取用户的协作列表 | Yes | Query: `page`, `limit`, `status` | ```{ "success": true, "data": { "collaborations": [...], "pagination": {...} } }``` |

## Creator Dashboard | 创作者仪表盘

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `GET` | `/creator/contents` | Get creator's content list<br>获取创作者内容列表 | Yes (Creator) | Query: `page`, `limit`, `status`, `contentType`, `search`, `sort`, `category`, `tag`, `dateFrom`, `dateTo`, `pricingModel`, `publishStatus` | ```{ "success": true, "data": { "contents": [...], "pagination": {...}, "filters": {...} } }``` |
| `GET` | `/creator/analytics/overview` | Get analytics overview<br>获取分析概览 | Yes (Creator) | N/A | ```{ "success": true, "data": { "totalStats": {...}, "recentTrend": [...], "topContents": [...] } }``` |
| `GET` | `/creator/analytics/contents/:contentId` | Get content analytics<br>获取内容分析 | Yes (Creator) | Path: `contentId`<br>Query: `period` | ```{ "success": true, "data": { "content": {...}, "period": "string", "stats": {...}, "viewsTrend": [...], "recentComments": [...] } }``` |
| `GET` | `/creator/analytics/trends` | Get analytics trends<br>获取分析趋势 | Yes (Creator) | Query: `period`, `metric` | ```{ "success": true, "data": { "period": "string", "metric": "string", "trends": [...] } }``` |
| `GET` | `/creator/analytics/audience` | Get audience analytics<br>获取受众分析 | Yes (Creator) | N/A | ```{ "success": true, "data": { "uniqueViewers": number, "returningViewers": number, "deviceDistribution": [...], "geographicDistribution": [...] } }``` |
| `GET` | `/creator/comments` | Get creator's comments<br>获取创作者评论 | Yes (Creator) | Query: `page`, `limit`, `sort`, `status` | ```{ "success": true, "data": { "comments": [...], "pagination": {...} } }``` |
| `POST` | `/creator/comments/:commentId/reply` | Reply to comment<br>回复评论 | Yes (Creator) | Path: `commentId`<br>Body: ```{ "text": "string" }``` | ```{ "success": true, "message": "string", "data": { "comment": {...} } }``` |
| `PUT` | `/creator/comments/:commentId/pin` | Pin/unpin comment<br>置顶/取消置顶评论 | Yes (Creator) | Path: `commentId`<br>Body: ```{ "isPinned": boolean }``` | ```{ "success": true, "message": "string", "data": { "comment": {...} } }``` |
| `GET` | `/creator/income/overview` | Get income overview<br>获取收入概览 | Yes (Creator) | N/A | ```{ "success": true, "data": { "overview": {...}, "bySource": [...], "trends": [...] } }``` |
| `GET` | `/creator/income/details` | Get income details<br>获取收入明细 | Yes (Creator) | Query: `page`, `limit`, `sort`, `source`, `startDate`, `endDate` | ```{ "success": true, "data": { "incomes": [...], "pagination": {...} } }``` |
| `POST` | `/creator/income/withdraw` | Request withdrawal<br>申请提现 | Yes (Creator) | ```{ "amount": number, "method": "string", "account": "string" }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `GET` | `/creator/contents/:contentId/export/:format` | Export content data<br>导出内容数据 | Yes (Creator) | Path: `contentId`, `format` | Content data in specified format |
| `PUT` | `/creator/contents/batch/status` | Batch update content status<br>批量更新内容状态 | Yes (Creator) | ```{ "contentIds": [...], "status": "string" }``` | ```{ "success": true, "message": "string", "data": { "updatedCount": number } }``` |
| `PUT` | `/creator/contents/batch/tags/add` | Batch add tags<br>批量添加标签 | Yes (Creator) | ```{ "contentIds": [...], "tags": [...] }``` | ```{ "success": true, "message": "string", "data": { "updatedCount": number, "addedTags": [...] } }``` |

## Media Management | 媒体管理

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `POST` | `/media/content/:contentId/subtitles` | Upload subtitle<br>上传字幕 | Yes | Path: `contentId`<br>Form: `subtitle`, `language` | ```{ "success": true, "message": "string", "data": { "subtitle": {...} } }``` |
| `POST` | `/media/content/:contentId/narrations` | Upload narration<br>上传旁白 | Yes | Path: `contentId`<br>Form: `narration`, `language`, `transcript` | ```{ "success": true, "message": "string", "data": { "narration": {...} } }``` |
| `POST` | `/media/content/:contentId/background-music` | Upload background music<br>上传背景音乐 | Yes | Path: `contentId`<br>Form: `music`, `title`, `artist` | ```{ "success": true, "message": "string", "data": { "backgroundMusic": {...} } }``` |
| `PUT` | `/media/content/:contentId/photo-settings` | Update photo settings<br>更新照片设置 | Yes | Path: `contentId`<br>Body: ```{ "displayDuration": number, "transitionEffect": "string", "panAndZoom": boolean, "panAndZoomSettings": {...} }``` | ```{ "success": true, "message": "string", "data": { "photoSettings": {...} } }``` |

## Fusion Content | 融合内容

Fusion content allows creators to combine multiple pieces of content into a single experience.

融合内容允许创作者将多个内容组合成一个单一的体验。

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `GET` | `/fusions` | Get fusion content list<br>获取融合内容列表 | Yes | Query: `page`, `limit`, `sort`, `category`, `status` | ```{ "success": true, "data": { "fusions": [...], "pagination": {...} } }``` |
| `POST` | `/fusions` | Create fusion content<br>创建融合内容 | Yes | ```{ "title": "string", "description": "string", "category": "string", "contentIds": [...], "coverImage": {...}, "settings": {...} }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `GET` | `/fusions/:fusionId` | Get fusion content details<br>获取融合内容详情 | Yes | Path: `fusionId` | ```{ "success": true, "data": { "fusion": {...}, "stats": {...} } }``` |
| `PUT` | `/fusions/:fusionId` | Update fusion content<br>更新融合内容 | Yes | Path: `fusionId`<br>Body: ```{ "title": "string", "description": "string", "category": "string", "coverImage": {...}, "settings": {...}, "status": "string" }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `DELETE` | `/fusions/:fusionId` | Delete fusion content<br>删除融合内容 | Yes | Path: `fusionId` | ```{ "success": true, "message": "string", "data": { "fusionId": "string" } }``` |
| `POST` | `/fusions/:fusionId/contents` | Add content to fusion<br>向融合内容添加内容 | Yes | Path: `fusionId`<br>Body: ```{ "contentId": "string", "order": number, "settings": {...} }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `DELETE` | `/fusions/:fusionId/contents/:contentId` | Remove content from fusion<br>从融合内容中移除内容 | Yes | Path: `fusionId`, `contentId` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `PUT` | `/fusions/:fusionId/contents/:contentId` | Update content settings in fusion<br>更新融合内容中的内容设置 | Yes | Path: `fusionId`, `contentId`<br>Body: ```{ "settings": {...}, "order": number }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `PUT` | `/fusions/:fusionId/contents/reorder` | Reorder fusion contents<br>重新排序融合内容 | Yes | Path: `fusionId`<br>Body: ```{ "contentOrders": [{ "contentId": "string", "order": number }] }``` | ```{ "success": true, "message": "string", "data": {...} }``` |
| `GET` | `/fusions/:fusionId/analytics` | Get fusion analytics<br>获取融合内容分析 | Yes | Path: `fusionId`<br>Query: `period` | ```{ "success": true, "data": {...} }``` |

## Recommendation | 内容推荐

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `GET` | `/recommendations/home` | Get home recommendations<br>获取首页推荐 | Yes | Query: `language` | ```{ "success": true, "data": { "featured": [...], "personalized": [...], "trending": [...], "continueWatching": [...] } }``` |
| `GET` | `/recommendations/content/:contentId` | Get content recommendations<br>获取内容推荐 | Yes | Path: `contentId` | ```{ "success": true, "data": { "similar": [...], "fromSameCreator": [...] } }``` |
| `GET` | `/recommendations/category/:category` | Get category recommendations<br>获取分类推荐 | Yes | Path: `category`<br>Query: `language` | ```{ "success": true, "data": { "featured": [...], "personalized": [...], "trending": [...] } }``` |
| `POST` | `/recommendations/interaction` | Record interaction and update recommendations<br>记录互动并更新推荐 | Yes | ```{ "contentId": "string", "interactionType": "string" }``` | ```{ "success": true, "message": "string", "data": { "success": boolean } }``` |
| `GET` | `/recommendations/preferences` | Get user preferences<br>获取用户偏好设置 | Yes | N/A | ```{ "success": true, "data": {...} }``` |
| `PUT` | `/recommendations/preferences` | Update user preferences<br>更新用户偏好设置 | Yes | ```{ "enablePersonalization": boolean, "categoryPreferences": {...}, "interactionWeights": {...} }``` | ```{ "success": true, "message": "string", "data": {...} }``` |

## Admin Dashboard | 管理员仪表盘

| Method | Endpoint | Description | Auth Required | Request Body/Params | Response |
|--------|----------|-------------|--------------|-------------|----------|
| `GET` | `/admin/dashboard` | Get dashboard statistics<br>获取仪表盘统计 | Yes (Admin) | N/A | ```{ "success": true, "data": {...} }``` |
| `GET` | `/admin/users` | List users<br>用户列表 | Yes (Admin) | Query: `page`, `limit`, `sort`, `search`, `role`, `status` | ```{ "success": true, "data": { "users": [...], "pagination": {...} } }``` |
| `GET` | `/admin/users/:userId` | Get user details<br>获取用户详情 | Yes (Admin) | Path: `userId` | ```{ "success": true, "data": { "user": {...}, "stats": {...} } }``` |
| `PUT` | `/admin/users/:userId` | Update user<br>更新用户 | Yes (Admin) | Path: `userId`<br>Body: ```{ ... }``` | ```{ "success": true, "message": "string", "data": { "user": {...} } }``` |
| `PUT` | `/admin/users/:userId/status` | Update user status<br>更新用户状态 | Yes (Admin) | Path: `userId`<br>Body: ```{ "status": "string", "reason": "string" }``` | ```{ "success": true, "message": "string", "data": { "user": {...} } }``` |
| `GET` | `/admin/contents` | List contents<br>内容列表 | Yes (Admin) | Query: `page`, `limit`, `sort`, `status`, `contentType`, `search` | ```{ "success": true, "data": { "contents": [...], "pagination": {...} } }``` |
| `GET` | `/admin/contents/:contentId` | Get content details<br>获取内容详情 | Yes (Admin) | Path: `contentId` | ```{ "success": true, "data": { "content": {...}, "stats": {...} } }``` |
| `PUT` | `/admin/contents/:contentId/status` | Update content status<br>更新内容状态 | Yes (Admin) | Path: `contentId`<br>Body: ```{ "status": "string", "reason": "string" }``` | ```{ "success": true, "message": "string", "data": { "content": {...} } }``` |
| `PUT` | `/admin/contents/:contentId/review` | Review content<br>审核内容 | Yes (Admin) | Path: `contentId`<br>Body: ```{ "approved": boolean, "reviewNote": "string" }``` | ```{ "success": true, "message": "string", "data": { "content": {...} } }``` |
| `GET` | `/admin/orders` | List orders<br>订单列表 | Yes (Admin) | Query: `page`, `limit`, `sort`, `status`, `type`, `search` | ```{ "success": true, "data": { "orders": [...], "pagination": {...} } }``` |
| `GET` | `/admin/orders/:orderNo` | Get order details<br>获取订单详情 | Yes (Admin) | Path: `orderNo` | ```{ "success": true, "data": { "order": {...} } }``` |
| `PUT` | `/admin/orders/:orderNo/status` | Update order status<br>更新订单状态 | Yes (Admin) | Path: `orderNo`<br>Body: ```{ "status": "string", "reason": "string" }``` | ```{ "success": true, "message": "string", "data": { "order": {...} } }``` |
| `GET` | `/admin/payments/income` | Get platform income<br>获取平台收入 | Yes (Admin) | Query: `period`, `year`, `month` | ```{ "success": true, "data": { "period": {...}, "summary": {...}, "byOrderType": [...], "byIncomeSource": [...] } }``` |
| `GET` | `/admin/payments/withdrawals` | Get withdrawal requests<br>获取提现请求 | Yes (Admin) | Query: `page`, `limit`, `status` | ```{ "success": true, "data": { "withdrawalsByCreator": [...], "pagination": {...} } }``` |
| `PUT` | `/admin/payments/withdrawals/:id/process` | Process withdrawal<br>处理提现 | Yes (Admin) | Path: `id`<br>Body: ```{ "approved": boolean, "reason": "string", "batchId": "string" }``` | ```{ "success": true, "message": "string", "data": { "withdrawal": {...} } }``` |
| `GET` | `/admin/settings` | Get system settings<br>获取系统设置 | Yes (Admin) | N/A | ```{ "success": true, "data": { "settings": {...} } }``` |
| `PUT` | `/admin/settings` | Update system settings<br>更新系统设置 | Yes (Admin) | ```{ ... }``` | ```{ "success": true, "message": "string", "data": { "settings": {...} } }``` |

## Error Handling | 错误处理

All error responses follow this format:

所有错误响应都遵循以下格式：

```json
{
    "success": false,
    "error": "error_code",
    "message": "Error description"
}
```

Common error codes:

常见错误代码：

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `error.validation_error` | Validation failed<br>验证失败 | 400 |
| `error.unauthorized` | Unauthorized access<br>未授权访问 | 401 |
| `error.not_found` | Resource not found<br>资源未找到 | 404 |
| `error.server_error` | Server error<br>服务器错误 | 500 |

## Pagination | 分页

Endpoints that return lists of resources support pagination with the following query parameters:

返回资源列表的端点支持使用以下查询参数进行分页：

- `page`: Page number (1-based, default: 1)
- `limit`: Number of items per page (default: 20)
- `sort`: Sort field (e.g. `createdAt`, `-createdAt` for descending)

Paginated responses include the following structure:

分页响应包含以下结构：

```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100,
        "pages": 5
    }
}
```

## Language Support | 语言支持

The API supports multiple languages through the `Accept-Language` header:

API 通过 `Accept-Language` 请求头支持多种语言：

```
Accept-Language: zh-CN
```

Supported languages:

支持的语言：

- `zh-CN`: Simplified Chinese (简体中文)
- `en-US`: English (英语)
- `ja-JP`: Japanese (日语)
- `ko-KR`: Korean (韩语)

When not specified, the API defaults to `zh-CN`.

如果未指定，API 默认使用 `zh-CN`。
