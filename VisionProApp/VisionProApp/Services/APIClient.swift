// APIClient.swift
import Foundation

class APIClient {
    static let shared = APIClient()
    private let networkManager = NetworkManager.shared
    
    private init() {}
    
    // MARK: - 认证相关
    
    // 登录
    func login(email: String, password: String) async throws -> LoginResponse {
        let body = ["email": email, "password": password]
        
        // 使用更健壮的方式处理响应
        let data = try await networkManager.requestRaw(
            "/users/login",
            method: .POST,
            body: body
        )
        
        // 打印原始响应用于调试
        if let jsonString = String(data: data, encoding: .utf8) {
            print("登录原始响应: \(jsonString)")
        }
        
        // 尝试解析响应
        do {
            let response = try JSONDecoder.apiDecoder.decode(APIResponse<LoginData>.self, from: data)
            
            guard let data = response.data else {
                throw APIError.serverError(response.message ?? "登录失败")
            }
            
            return LoginResponse(user: data.user, token: data.token)
        } catch {
            // 如果解析失败，尝试直接解析data字段
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let dataObject = json["data"] as? [String: Any],
               let userObject = dataObject["user"] as? [String: Any],
               let token = dataObject["token"] as? String {
                
                // 手动处理用户数据
                let userData = try JSONSerialization.data(withJSONObject: userObject)
                let user = try JSONDecoder.apiDecoder.decode(User.self, from: userData)
                
                return LoginResponse(user: user, token: token)
            }
            
            // 如果所有尝试都失败，抛出原始错误
            throw error
        }
    }
    
    // 注册
    func register(username: String, email: String, password: String) async throws -> LoginResponse {
        let body = [
            "username": username,
            "email": email,
            "password": password
        ]
        
        let response: APIResponse<LoginData> = try await networkManager.request(
            "/users/register",
            method: .POST,
            body: body
        )
        
        guard let data = response.data else {
            throw APIError.serverError(response.message ?? "注册失败")
        }
        
        return LoginResponse(user: data.user, token: data.token)
    }
    
    // 获取当前用户信息
    func getCurrentUser() async throws -> User {
        let response: APIResponse<User> = try await networkManager.request("/users/profile")
        
        guard let user = response.data else {
            throw APIError.serverError(response.message ?? "获取用户信息失败")
        }
        
        return user
    }
    
    // MARK: - 内容相关
    
    // 获取内容列表
        func getContents(
            page: Int = 1,
            limit: Int = 20,
            contentType: String? = nil,
            category: String? = nil
        ) async throws -> [Content] {
            var queryParams = [
                "page": "\(page)",
                "limit": "\(limit)",
                "status": "published"
            ]
            
            if let contentType = contentType {
                queryParams["contentType"] = contentType
            }
            
            if let category = category {
                queryParams["category"] = category
            }
            
            // 首先尝试使用原始请求方法获取数据
            let data = try await networkManager.requestRaw(
                "/contents",
                method: .GET,
                queryParams: queryParams
            )
            
            // 打印原始响应用于调试
            if let jsonString = String(data: data, encoding: .utf8) {
                print("内容列表原始响应: \(jsonString)")
            }
            
            // 尝试解析响应
            do {
                let response = try JSONDecoder.apiDecoder.decode(APIResponse<ContentsPaginatedResponse>.self, from: data)
                
                guard let data = response.data else {
                    throw APIError.serverError(response.message ?? "获取内容列表失败")
                }
                
                return data.contents
            } catch {
                // 如果解析失败，尝试其他格式
                print("解析错误: \(error)")
                
                // 尝试直接解析data字段
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let dataObject = json["data"] as? [String: Any],
                   let contents = dataObject["contents"] as? [[String: Any]] {
                    
                    // 手动解析内容数组
                    var contentList: [Content] = []
                    for contentDict in contents {
                        let contentData = try JSONSerialization.data(withJSONObject: contentDict)
                        let content = try JSONDecoder.apiDecoder.decode(Content.self, from: contentData)
                        contentList.append(content)
                    }
                    
                    return contentList
                }
                
                // 如果所有尝试都失败，抛出原始错误
                throw error
            }
        }
    
    // 创建内容
    func createContent(
        title: [String: String],
        description: [String: String]?,
        contentType: String,
        files: [String: Any],
        tags: [String]?,
        category: String,
        pricing: [String: Any]
    ) async throws -> Content {
        let body: [String: Any] = [
            "title": title,
            "description": description ?? [:],
            "contentType": contentType,
            "files": files,
            "tags": tags ?? [],
            "category": category,
            "pricing": pricing
        ]
        
        let response: APIResponse<Content> = try await networkManager.request(
            "/contents",
            method: .POST,
            body: body
        )
        
        guard let content = response.data else {
            throw APIError.serverError(response.message ?? "创建内容失败")
        }
        
        return content
    }
    
    // MARK: - 通用请求方法（用于 InteractionService）
    
    func request<T: Decodable>(
        _ endpoint: String,
        method: HTTPMethod = .GET,
        queryParams: [String: String]? = nil,
        body: [String: Any]? = nil
    ) async throws -> APIResponse<T> {
        return try await networkManager.request(
            endpoint,
            method: method,
            queryParams: queryParams,
            body: body
        )
    }
}
//

