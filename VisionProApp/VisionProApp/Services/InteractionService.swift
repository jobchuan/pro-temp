//
//  InteractionService.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Services/InteractionService.swift
import Foundation
// 交互服务类
class InteractionService: ObservableObject {
    @Published var likedContents: Set<String> = []
    @Published var favoritedContents: Set<String> = []
    @Published var viewHistory: [ViewHistory] = []
    @Published var comments: [String: [Comment]] = [:]
    @Published var offlineContents: [OfflineContent] = []
    // 切换点赞状态
    func toggleLike(contentId: String) async throws {
        let endpoint = "/interactions/content/\(contentId)/like"
        
        let response: APIResponse<InteractionResponse> = try await APIClient.shared.request(
            endpoint,
            method: .POST
        )
        
        guard let data = response.data else {
            throw APIError.responseParsingError("响应数据为空")
        }
        
        // 更新本地状态
        if data.liked {
            likedContents.insert(contentId)
        } else {
            likedContents.remove(contentId)
        }
    }
    
    // 切换收藏状态
    func toggleFavorite(contentId: String) async throws {
        let endpoint = "/interactions/content/\(contentId)/favorite"
        
        let response: APIResponse<InteractionResponse> = try await APIClient.shared.request(
            endpoint,
            method: .POST
        )
        
        guard let data = response.data else {
            throw APIError.responseParsingError("响应数据为空")
        }
        
        // 更新本地状态
        if data.favorited {
            favoritedContents.insert(contentId)
        } else {
            favoritedContents.remove(contentId)
        }
    }
    
    // 获取交互状态
    func getInteractionStatus(contentId: String) async throws -> InteractionStatus {
        let endpoint = "/interactions/content/\(contentId)/status"
        
        let response: APIResponse<InteractionStatus> = try await APIClient.shared.request(
            endpoint,
            method: .GET
        )
        
        guard let status = response.data else {
            throw APIError.responseParsingError("无法获取交互状态")
        }
        
        // 更新本地状态
        if status.liked {
            likedContents.insert(contentId)
        }
        if status.favorited {
            favoritedContents.insert(contentId)
        }
        
        return status
    }
    
    // 添加评论
    func addComment(contentId: String, text: String, parentId: String? = nil, spatialAnchor: SpatialAnchor? = nil) async throws -> Comment {
        let endpoint = "/interactions/content/\(contentId)/comments"
        
        var body: [String: Any] = ["text": text]
        if let parentId = parentId {
            body["parentId"] = parentId
        }
        if let spatialAnchor = spatialAnchor {
            body["spatialAnchor"] = [
                "position": ["x": spatialAnchor.position.x, "y": spatialAnchor.position.y, "z": spatialAnchor.position.z],
                "rotation": ["x": spatialAnchor.rotation.x, "y": spatialAnchor.rotation.y, "z": spatialAnchor.rotation.z, "w": spatialAnchor.rotation.w]
            ]
        }
        
        let response: APIResponse<Comment> = try await APIClient.shared.request(
            endpoint,
            method: .POST,
            body: body
        )
        
        guard let comment = response.data else {
            throw APIError.responseParsingError("无法添加评论")
        }
        
        // 更新本地评论列表
        if comments[contentId] != nil {
            comments[contentId]?.append(comment)
        } else {
            comments[contentId] = [comment]
        }
        
        return comment
    }
    
    // 获取评论列表
    func getComments(contentId: String, page: Int = 1, limit: Int = 20) async throws -> [Comment] {
        let endpoint = "/interactions/content/\(contentId)/comments"
        let queryParams = [
            "page": "\(page)",
            "limit": "\(limit)"
        ]
        
        let response: APIResponse<CommentListResponse> = try await APIClient.shared.request(
            endpoint,
            method: .GET,
            queryParams: queryParams
        )
        
        guard let data = response.data else {
            throw APIError.responseParsingError("无法获取评论列表")
        }
        
        // 缓存评论
        comments[contentId] = data.comments
        
        return data.comments
    }
    
    // 删除评论
    func deleteComment(commentId: String) async throws {
        let endpoint = "/interactions/comments/\(commentId)"
        
        let _: APIResponse<EmptyResponse> = try await APIClient.shared.request(
            endpoint,
            method: .DELETE
        )
    }
    
    // 记录观看历史
    func recordViewHistory(contentId: String, progress: TimeInterval, duration: TimeInterval) async throws {
        let endpoint = "/interactions/content/\(contentId)/view"
        let body = [
            "progress": progress,
            "duration": duration
        ]
        
        let response: APIResponse<ViewHistory> = try await APIClient.shared.request(
            endpoint,
            method: .POST,
            body: body
        )
        
        guard let history = response.data else {
            throw APIError.responseParsingError("无法记录观看历史")
        }
        
        // 更新本地历史
        if let index = viewHistory.firstIndex(where: { $0.contentId == contentId }) {
            viewHistory[index] = history
        } else {
            viewHistory.append(history)
        }
    }
    
    // 获取观看历史
    func getViewHistory(page: Int = 1, limit: Int = 20) async throws -> [ViewHistory] {
        let endpoint = "/interactions/history"
        let queryParams = [
            "page": "\(page)",
            "limit": "\(limit)"
        ]
        
        let response: APIResponse<ViewHistoryResponse> = try await APIClient.shared.request(
            endpoint,
            method: .GET,
            queryParams: queryParams
        )
        
        guard let data = response.data else {
            throw APIError.responseParsingError("无法获取观看历史")
        }
        
        viewHistory = data.history
        return data.history
    }
    
    // 获取继续观看列表
    func getContinueWatching(limit: Int = 10) async throws -> [ViewHistory] {
        let endpoint = "/interactions/continue-watching"
        let queryParams = ["limit": "\(limit)"]
        
        let response: APIResponse<[ViewHistory]> = try await APIClient.shared.request(
            endpoint,
            method: .GET,
            queryParams: queryParams
        )
        
        guard let data = response.data else {
            throw APIError.responseParsingError("无法获取继续观看列表")
        }
        
        return data
    }
    
    // 创建离线下载
    func createOfflineDownload(contentId: String, quality: String = "high") async throws {
        let endpoint = "/interactions/content/\(contentId)/offline"
        let body = ["quality": quality]
        
        let response: APIResponse<OfflineContent> = try await APIClient.shared.request(
            endpoint,
            method: .POST,
            body: body
        )
        
        guard let offlineContent = response.data else {
            throw APIError.responseParsingError("无法创建离线下载")
        }
        
        // 添加到本地列表
        offlineContents.append(offlineContent)
    }
    
    // 获取离线内容列表
    func getOfflineContent(page: Int = 1, limit: Int = 20, status: String? = nil) async throws -> [OfflineContent] {
        let endpoint = "/interactions/offline"
        var queryParams = [
            "page": "\(page)",
            "limit": "\(limit)"
        ]
        
        if let status = status {
            queryParams["status"] = status
        }
        
        let response: APIResponse<OfflineContentResponse> = try await APIClient.shared.request(
            endpoint,
            method: .GET,
            queryParams: queryParams
        )
        
        guard let data = response.data else {
            throw APIError.responseParsingError("无法获取离线内容")
        }
        
        offlineContents = data.content
        return data.content
    }
    
    // 发送弹幕
    func sendDanmaku(contentId: String, text: String, timestamp: TimeInterval, type: DanmakuType = .scroll, style: DanmakuStyle? = nil) async throws -> Danmaku {
        let endpoint = "/interactions/content/\(contentId)/danmaku"
        
        var body: [String: Any] = [
            "text": text,
            "timestamp": timestamp,
            "type": type.rawValue
        ]
        
        if let style = style {
            body["style"] = [
                "color": style.color,
                "fontSize": style.fontSize
            ]
        }
        
        let response: APIResponse<Danmaku> = try await APIClient.shared.request(
            endpoint,
            method: .POST,
            body: body
        )
        
        guard let danmaku = response.data else {
            throw APIError.responseParsingError("无法发送弹幕")
        }
        
        return danmaku
    }
    
    // 获取弹幕列表
    func getDanmakuList(contentId: String, startTime: TimeInterval = 0, endTime: TimeInterval? = nil, limit: Int = 1000) async throws -> [Danmaku] {
        let endpoint = "/interactions/content/\(contentId)/danmaku"
        
        var queryParams = [
            "startTime": "\(startTime)",
            "limit": "\(limit)"
        ]
        
        if let endTime = endTime {
            queryParams["endTime"] = "\(endTime)"
        }
        
        let response: APIResponse<[Danmaku]> = try await APIClient.shared.request(
            endpoint,
            method: .GET,
            queryParams: queryParams
        )
        
        guard let danmakus = response.data else {
            throw APIError.responseParsingError("无法获取弹幕列表")
        }
        
        return danmakus
    }
}

// MARK: - 响应模型
struct InteractionResponse: Decodable {
    let liked: Bool
    let favorited: Bool
    let contentId: String
}

struct CommentListResponse: Decodable {
    let comments: [Comment]
    let pagination: Pagination
}

struct ViewHistoryResponse: Decodable {
    let history: [ViewHistory]
    let pagination: Pagination
}

struct OfflineContentResponse: Decodable {
    let content: [OfflineContent]
    let pagination: Pagination
}
