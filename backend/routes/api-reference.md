# Vision Pro Platform API Reference

This document provides a comprehensive reference for all the API endpoints available in the Vision Pro immersive content platform backend.

## Table of Contents
- [Authentication](#authentication)
- [User Management](#user-management)
- [Content Management](#content-management)
- [Interaction Management](#interaction-management)
- [Upload Management](#upload-management)
- [Payment Management](#payment-management)
- [Collaboration Management](#collaboration-management)
- [Creator Dashboard](#creator-dashboard)
- [Admin Dashboard](#admin-dashboard)

## Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/users/register` | Register a new user | No |
| `POST` | `/api/users/login` | Login with email and password | No |

## User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/api/users/me` | Get current user information | Yes |
| `PUT` | `/api/users/profile` | Update user profile information | Yes |
| `PUT` | `/api/users/change-password` | Change user password | Yes |

## Content Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/api/contents` | Get public content list | No |
| `POST` | `/api/contents` | Create new content | Yes |
| `GET` | `/api/contents/user` | Get user's content list | Yes |
| `GET` | `/api/contents/:contentId` | Get specific content details | Yes |
| `PUT` | `/api/contents/:contentId` | Update content | Yes |
| `DELETE` | `/api/contents/:contentId` | Delete content (archive) | Yes |

## Interaction Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/interactions/content/:contentId/like` | Like/unlike content | Yes |
| `POST` | `/api/interactions/content/:contentId/favorite` | Favorite/unfavorite content | Yes |
| `GET` | `/api/interactions/content/:contentId/status` | Get interaction status | Yes |
| `POST` | `/api/interactions/content/:contentId/comments` | Add comment to content | Yes |
| `GET` | `/api/interactions/content/:contentId/comments` | Get content comments | No |
| `DELETE` | `/api/interactions/comments/:commentId` | Delete comment | Yes |
| `POST` | `/api/interactions/content/:contentId/view` | Record view history | Yes |
| `GET` | `/api/interactions/history` | Get user view history | Yes |
| `GET` | `/api/interactions/continue-watching` | Get continue watching list | Yes |
| `POST` | `/api/interactions/content/:contentId/offline` | Create offline download | Yes |
| `GET` | `/api/interactions/offline` | Get offline content list | Yes |
| `POST` | `/api/interactions/content/:contentId/danmaku` | Send danmaku (bullet comment) | Yes |
| `GET` | `/api/interactions/content/:contentId/danmaku` | Get danmaku list | No |
| `GET` | `/api/interactions/content/:contentId/danmaku/density` | Get danmaku density | No |

## Upload Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/upload/single` | Upload single file | Yes |
| `POST` | `/api/upload/multiple` | Upload multiple files | Yes |
| `POST` | `/api/upload/chunk/init` | Initialize chunk upload | Yes |
| `POST` | `/api/upload/chunk/upload` | Upload file chunk | Yes |
| `POST` | `/api/upload/chunk/complete` | Complete chunk upload | Yes |
| `DELETE` | `/api/upload/chunk/:identifier` | Cancel upload | Yes |
| `GET` | `/api/upload/chunk/:identifier/progress` | Get upload progress | Yes |

## Payment Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/payment/order/subscription` | Create subscription order | Yes |
| `POST` | `/api/payment/order/content` | Create content purchase order | Yes |
| `POST` | `/api/payment/order/tip` | Create tip order | Yes |
| `POST` | `/api/payment/callback/alipay` | Alipay payment callback | No |
| `POST` | `/api/payment/callback/wechat` | WeChat payment callback | No |
| `POST` | `/api/payment/callback/stripe` | Stripe payment callback | No |
| `POST` | `/api/payment/callback/apple` | Apple subscription notification | No |
| `POST` | `/api/payment/apple/verify` | Verify Apple IAP receipt | Yes |
| `POST` | `/api/payment/apple/restore` | Restore Apple IAP purchases | Yes |
| `GET` | `/api/payment/order/:orderNo` | Query order status | Yes |
| `GET` | `/api/payment/orders` | Get user orders | Yes |
| `GET` | `/api/payment/subscription` | Get user subscription | Yes |
| `POST` | `/api/payment/subscription/cancel` | Cancel subscription | Yes |

## Collaboration Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/collaborations/content/:contentId/invite` | Invite collaborator | Yes |
| `POST` | `/api/collaborations/:collaborationId/accept` | Accept collaboration invitation | Yes |
| `POST` | `/api/collaborations/:collaborationId/decline` | Decline collaboration invitation | Yes |
| `GET` | `/api/collaborations/:collaborationId` | Get collaboration details | Yes |
| `PUT` | `/api/collaborations/:collaborationId/collaborator/:collaboratorId/permissions` | Update collaborator permissions | Yes |
| `DELETE` | `/api/collaborations/:collaborationId/collaborator/:collaboratorId` | Remove collaborator | Yes |
| `GET` | `/api/collaborations/user/list` | Get user's collaborations | Yes |

## Creator Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/api/creator/contents` | Get creator's content list | Yes (Creator) |
| `GET` | `/api/creator/contents/:contentId` | Get creator's content details | Yes (Creator) |
| `POST` | `/api/creator/contents` | Create new content | Yes (Creator) |
| `PUT` | `/api/creator/contents/:contentId` | Update content | Yes (Creator) |
| `DELETE` | `/api/creator/contents/:contentId` | Delete content | Yes (Creator) |
| `PUT` | `/api/creator/contents/:contentId/status` | Update content status | Yes (Creator) |
| `PUT` | `/api/creator/contents/batch/status` | Batch update content status | Yes (Creator) |
| `PUT` | `/api/creator/contents/batch/tags/add` | Batch add tags | Yes (Creator) |
| `PUT` | `/api/creator/contents/batch/tags/remove` | Batch remove tags | Yes (Creator) |
| `PUT` | `/api/creator/contents/batch/category` | Batch update category | Yes (Creator) |
| `DELETE` | `/api/creator/contents/batch` | Batch delete contents | Yes (Creator) |
| `GET` | `/api/creator/analytics/overview` | Get analytics overview | Yes (Creator) |
| `GET` | `/api/creator/analytics/contents/:contentId` | Get content analytics | Yes (Creator) |
| `GET` | `/api/creator/analytics/trends` | Get analytics trends | Yes (Creator) |
| `GET` | `/api/creator/analytics/audience` | Get audience analytics | Yes (Creator) |
| `GET` | `/api/creator/comments` | Get creator's comments | Yes (Creator) |
| `GET` | `/api/creator/contents/:contentId/comments` | Get content comments | Yes (Creator) |
| `POST` | `/api/creator/comments/:commentId/reply` | Reply to comment | Yes (Creator) |
| `PUT` | `/api/creator/comments/:commentId/pin` | Pin/unpin comment | Yes (Creator) |
| `PUT` | `/api/creator/comments/:commentId/status` | Update comment status | Yes (Creator) |
| `GET` | `/api/creator/income/overview` | Get income overview | Yes (Creator) |
| `GET` | `/api/creator/income/details` | Get income details | Yes (Creator) |
| `GET` | `/api/creator/income/trends` | Get income trends | Yes (Creator) |
| `GET` | `/api/creator/income/analytics` | Get income analytics | Yes (Creator) |
| `POST` | `/api/creator/income/withdraw` | Request withdrawal | Yes (Creator) |
| `GET` | `/api/creator/income/withdrawals` | Get withdrawal history | Yes (Creator) |
| `GET` | `/api/creator/profile` | Get creator profile | Yes (Creator) |
| `PUT` | `/api/creator/profile` | Update creator profile | Yes (Creator) |
| `PUT` | `/api/creator/payment-info` | Update payment info | Yes (Creator) |
| `PUT` | `/api/creator/notification-settings` | Update notification settings | Yes (Creator) |
| `GET` | `/api/creator/contents/:contentId/export/:format` | Export content data | Yes (Creator) |
| `GET` | `/api/creator/notifications` | Get notifications | Yes (Creator) |
| `PUT` | `/api/creator/notifications/read` | Mark notifications as read | Yes (Creator) |

## Admin Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/api/admin/dashboard` | Get dashboard statistics | Yes (Admin) |
| `GET` | `/api/admin/users` | List users | Yes (Admin) |
| `GET` | `/api/admin/users/:userId` | Get user details | Yes (Admin) |
| `PUT` | `/api/admin/users/:userId` | Update user | Yes (Admin) |
| `PUT` | `/api/admin/users/:userId/status` | Update user status | Yes (Admin) |
| `GET` | `/api/admin/contents` | List contents | Yes (Admin) |
| `GET` | `/api/admin/contents/:contentId` | Get content details | Yes (Admin) |
| `PUT` | `/api/admin/contents/:contentId/status` | Update content status | Yes (Admin) |
| `PUT` | `/api/admin/contents/:contentId/review` | Review content | Yes (Admin) |
| `GET` | `/api/admin/orders` | List orders | Yes (Admin) |
| `GET` | `/api/admin/orders/:orderNo` | Get order details | Yes (Admin) |
| `PUT` | `/api/admin/orders/:orderNo/status` | Update order status | Yes (Admin) |
| `GET` | `/api/admin/payments/income` | Get platform income | Yes (Admin) |
| `GET` | `/api/admin/payments/withdrawals` | Get withdrawal requests | Yes (Admin) |
| `PUT` | `/api/admin/payments/withdrawals/:id/process` | Process withdrawal | Yes (Admin) |
| `GET` | `/api/admin/payments/creator-income` | Get creator income stats | Yes (Admin) |
| `GET` | `/api/admin/comments` | List flagged comments | Yes (Admin) |
| `PUT` | `/api/admin/comments/:commentId/status` | Update comment status | Yes (Admin) |
| `GET` | `/api/admin/reports/user-growth` | Get user growth stats | Yes (Admin) |
| `GET` | `/api/admin/reports/content-publish` | Get content publish stats | Yes (Admin) |
| `GET` | `/api/admin/reports/revenue-trends` | Get revenue trends | Yes (Admin) |
| `GET` | `/api/admin/notifications` | List notifications | Yes (Admin) |
| `POST` | `/api/admin/notifications` | Create notification | Yes (Admin) |
| `PUT` | `/api/admin/notifications/:id` | Update notification | Yes (Admin) |
| `PUT` | `/api/admin/notifications/:id/publish` | Publish notification | Yes (Admin) |
| `DELETE` | `/api/admin/notifications/:id` | Delete notification | Yes (Admin) |
| `GET` | `/api/admin/settings` | Get system settings | Yes (Admin) |
| `PUT` | `/api/admin/settings` | Update system settings | Yes (Admin) |
| `GET` | `/api/admin/logs` | Get admin logs | Yes (Admin) |

## System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/api/health` | Health check endpoint | No |
