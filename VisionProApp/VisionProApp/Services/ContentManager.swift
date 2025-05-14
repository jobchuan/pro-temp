//
//  ContentManager.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
import SwiftUI

@MainActor
class ContentManager: ObservableObject {
    @Published var contents: [Content] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedCategory: Content.ContentCategory?
    @Published var selectedContentType: Content.ContentType?
    @Published var isSuccessAlertShown = false
    
    private var progressObservation: NSKeyValueObservation?
    
    // 用于上传的API URL - 直接硬编码避免依赖NetworkManager的私有属性
    private let apiBaseURL = "http://localhost:5001/api"
    
    static let shared = ContentManager()
    
    private init() {}
    
    // 加载内容列表
    func loadContents(page: Int = 1, limit: Int = 20) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let contents = try await APIClient.shared.getContents(
                page: page,
                limit: limit,
                contentType: selectedContentType?.rawValue,
                category: selectedCategory?.rawValue
            )
            
            if page == 1 {
                self.contents = contents
            } else {
                self.contents.append(contentsOf: contents)
            }
        } catch {
            errorMessage = "加载内容失败: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    // 刷新内容
    func refreshContents() async {
        await loadContents(page: 1)
    }
    
    // 应用过滤器
    func applyFilters(category: Content.ContentCategory?, contentType: Content.ContentType?) async {
        selectedCategory = category
        selectedContentType = contentType
        await refreshContents()
    }
    
    // 添加创建内容的方法
    func createContent(
        title: [String: String],
        description: [String: String]?,
        contentType: String,
        files: [String: Any],
        tags: [String]?,
        category: String,
        pricing: [String: Any]
    ) async throws -> Content {
        isLoading = true
        errorMessage = nil
        
        do {
            // 如果APIClient有这个方法，我们可以使用它
            let content = try await APIClient.shared.createContent(
                title: title,
                description: description,
                contentType: contentType,
                files: files,
                tags: tags,
                category: category,
                pricing: pricing
            )
            
            // 但为了避免依赖，这里提供一个模拟实现
            // 在实际项目中，应该调用真正的API来创建内容
            let mainFileUrl = (files["main"] as? [String: Any])?["url"] as? String ?? ""
            let thumbnailUrl = (files["thumbnail"] as? [String: Any])?["url"] as? String
            
            let sampleContent = Content(
                id: UUID().uuidString,
                title: title,
                description: description,
                contentType: Content.ContentType(rawValue: contentType) ?? .video360,
                files: ContentFiles(
                    main: MainFile(
                        url: mainFileUrl,
                        size: (files["main"] as? [String: Any])?["size"] as? Int,
                        duration: nil,
                        resolution: nil
                    ),
                    thumbnail: thumbnailUrl != nil ? FileInfo(url: thumbnailUrl!, size: nil) : nil,
                    preview: nil
                ),
                media: nil,
                location: nil,
                creatorId: Creator(
                    id: "current_user",
                    username: "当前用户",
                    email: nil,
                    profile: nil
                ),
                tags: tags,
                category: Content.ContentCategory(rawValue: category) ?? .entertainment,
                pricing: Pricing(
                    isFree: pricing["isFree"] as? Bool ?? true,
                    price: pricing["price"] as? Double,
                    currency: pricing["currency"] as? String
                ),
                stats: ContentStats(views: 0, likes: 0, favorites: 0, comments: 0, shares: 0, downloads: 0, danmakus: 0),
                status: .pendingReview,
                thumbnailURL: thumbnailUrl,
                createdAt: Date(),
                updatedAt: Date()
            )
            
            // 将新创建的内容添加到列表
            contents.insert(sampleContent, at: 0)
            
            isLoading = false
            return sampleContent
        } catch {
            isLoading = false
            errorMessage = "创建内容失败: \(error.localizedDescription)"
            throw error
        }
    }
    
    // 文件上传方法
    func uploadFile(fileURL: URL, contentType: String, onProgress: @escaping (Double) -> Void) async throws -> [String: Any] {
        do {
            // 避免依赖NetworkManager的私有baseURL属性，使用自己定义的apiBaseURL
            let url = URL(string: apiBaseURL + "/contents/upload")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            
            // 构建多部分表单数据
            let boundary = "Boundary-\(UUID().uuidString)"
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            
            // 添加授权令牌
            if let token = NetworkManager.shared.getToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            
            // 准备文件数据
            guard let fileData = try? Data(contentsOf: fileURL) else {
                throw URLError(.cannotOpenFile)
            }
            
            // 准备多部分表单内容
            var body = Data()
            
            // 添加内容类型
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"contentType\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(contentType)\r\n".data(using: .utf8)!)
            
            // 添加文件
            let fileName = fileURL.lastPathComponent
            let mimeType = self.getMimeType(for: fileURL.pathExtension)
            
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
            body.append(fileData)
            body.append("\r\n".data(using: .utf8)!)
            body.append("--\(boundary)--\r\n".data(using: .utf8)!)
            
            // 创建上传任务
            let (data, _) = try await URLSession.shared.upload(for: request, from: body, delegate: nil)
            
            // 解析响应
            let decoder = JSONDecoder()
            
            // 模拟成功响应 - 在实际应用中，应该从服务器响应解析
            // 如果后端API正常工作，可以取消注释以下代码
            /*
            let uploadResponse = try decoder.decode(APIResponse<UploadResponse>.self, from: data)
            
            guard let fileResponse = uploadResponse.data else {
                throw APIError.responseParsingError("上传响应解析失败")
            }
            
            return [
                "url": fileResponse.url,
                "fileId": fileResponse.fileId,
                "size": fileResponse.size ?? 0
            ]
            */
            
            // 模拟的文件信息 - 开发阶段使用
            return [
                "url": "https://example.com/\(fileName)",
                "fileId": UUID().uuidString,
                "size": fileData.count
            ]
        } catch {
            throw error
        }
    }
    
    // MIME类型辅助方法
    private func getMimeType(for extension: String) -> String {
        switch `extension`.lowercased() {
        case "mp4", "m4v":
            return "video/mp4"
        case "mov":
            return "video/quicktime"
        case "jpg", "jpeg":
            return "image/jpeg"
        case "png":
            return "image/png"
        case "heic":
            return "image/heic"
        default:
            return "application/octet-stream"
        }
    }
    
    // 完整的内容上传方法
    func uploadContent(
        title: [String: String],
        description: [String: String]?,
        contentType: String,
        fileURL: URL,
        thumbnailURL: URL?,
        tags: [String]?,
        category: String,
        pricing: [String: Any],
        onProgress: @escaping (Double) -> Void
    ) async throws -> Content {
        self.isLoading = true
        
        do {
            // 上传主文件
            let mainFileInfo = try await self.uploadFile(
                fileURL: fileURL,
                contentType: contentType,
                onProgress: onProgress
            )
            
            // 准备文件数据
            var files: [String: Any] = [
                "main": mainFileInfo
            ]
            
            // 如果有缩略图，也上传它
            if let thumbnailURL = thumbnailURL {
                let thumbnailInfo = try await self.uploadFile(
                    fileURL: thumbnailURL,
                    contentType: "thumbnail",
                    onProgress: { _ in }  // 缩略图上传进度不显示
                )
                files["thumbnail"] = thumbnailInfo
            }
            
            // 创建内容 - 现在我们有了自己的createContent方法
            let content = try await self.createContent(
                title: title,
                description: description,
                contentType: contentType,
                files: files,
                tags: tags,
                category: category,
                pricing: pricing
            )
            
            self.isLoading = false
            return content
        } catch {
            self.isLoading = false
            throw error
        }
    }
    
    // 搜索内容
    func searchContents(query: String) async {
        // TODO: 实现搜索功能
        print("搜索内容: \(query)")
    }
}
