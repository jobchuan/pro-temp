//
//  ContentService.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Services/ContentService.swift
import Foundation

class ContentService: ObservableObject {
    @Published var contents: [Content] = []
    @Published var isLoading = false
    @Published var error: Error?
    
    // 获取内容列表
    func getContents(
        page: Int = 1,
        limit: Int = 20,
        status: String = "published",
        contentType: String? = nil,
        category: String? = nil
    ) async {
        isLoading = true
        error = nil
        
        do {
            contents = try await APIClient.shared.getContents(
                page: page,
                limit: limit,
                contentType: contentType,
                category: category
            )
        } catch {
            self.error = error
            print("获取内容列表失败: \(error)")
        }
        
        isLoading = false
    }
    
    // 创建内容
    func createContent(
        title: [String: String],
        description: [String: String]?,
        contentType: String,
        files: [String: Any],
        media: [String: Any]? = nil,
        location: [String: Any]? = nil,
        tags: [String]? = nil,
        category: String,
        pricing: [String: Any],
        isCollaborative: Bool = false
    ) async throws -> Content {
        isLoading = true
        error = nil
        
        do {
            let content = try await APIClient.shared.createContent(
                title: title,
                description: description,
                contentType: contentType,
                files: files,
                tags: tags,
                category: category,
                pricing: pricing
            )
            
            // 将新内容添加到列表
            contents.insert(content, at: 0)
            
            isLoading = false
            return content
        } catch {
            self.error = error
            isLoading = false
            throw error
        }
    }
    
    // 获取内容详情
    func getContent(contentId: String) async throws -> Content {
        let endpoint = "/contents/\(contentId)"
        let response: APIResponse<Content> = try await NetworkManager.shared.request(endpoint)
        
        guard let content = response.data else {
            throw APIError.serverError(response.message ?? "获取内容失败")
        }
        
        return content
    }
    
    // 获取用户内容
    func getUserContents(page: Int = 1, limit: Int = 20) async throws -> PaginatedResponse<Content> {
        let endpoint = "/contents/user"
        let queryParams = [
            "page": "\(page)",
            "limit": "\(limit)"
        ]
        
        let response: APIResponse<PaginatedResponse<Content>> = try await NetworkManager.shared.request(
            endpoint,
            queryParams: queryParams
        )
        
        guard let data = response.data else {
            throw APIError.serverError(response.message ?? "获取内容失败")
        }
        
        return data
    }
    
    // 更新内容
    func updateContent(contentId: String, updates: [String: Any]) async throws -> Content {
        let endpoint = "/contents/\(contentId)"
        let response: APIResponse<Content> = try await NetworkManager.shared.request(
            endpoint,
            method: .PUT,
            body: updates
        )
        
        guard let content = response.data else {
            throw APIError.serverError(response.message ?? "更新内容失败")
        }
        
        return content
    }
    
    // 删除内容
    func deleteContent(contentId: String) async throws {
        let endpoint = "/contents/\(contentId)"
        let _: APIResponse<EmptyResponse> = try await NetworkManager.shared.request(
            endpoint,
            method: .DELETE
        )
    }
}
