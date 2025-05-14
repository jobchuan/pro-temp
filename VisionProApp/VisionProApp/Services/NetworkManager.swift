//
//  NetworkManager.swift
//  VisionProApp
//
//  Created on 2025/5/11.
//
// Services/NetworkManager.swift
import Foundation

// HTTP方法枚举
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
    case PATCH = "PATCH"
}

class NetworkManager {
    static let shared = NetworkManager()
    private let baseURL = "http://localhost:5001/api"
    private var authToken: String?
    
    private init() {}
    
    // 设置认证令牌
    func setToken(_ token: String?) {
        self.authToken = token
    }
    
    // 获取认证令牌
    func getToken() -> String? {
        return authToken
    }
    
    // 原始数据请求方法
    func requestRaw(
        _ endpoint: String,
        method: HTTPMethod = .GET,
        queryParams: [String: String]? = nil,
        body: [String: Any]? = nil,
        headers: [String: String]? = nil
    ) async throws -> Data {
        // 构建URL
        var urlString = baseURL + endpoint
        
        // 添加查询参数
        if let queryParams = queryParams, !queryParams.isEmpty {
            let queryString = queryParams
                .map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0.value)" }
                .joined(separator: "&")
            urlString += "?" + queryString
        }
        
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        
        // 创建请求
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // 设置请求头
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("zh-CN", forHTTPHeaderField: "Accept-Language")
        
        // 添加认证令牌
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // 添加自定义请求头
        if let headers = headers {
            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        
        // 添加请求体
        if let body = body {
            do {
                request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
            } catch {
                throw APIError.encodingError(error)
            }
        }
        
        // 发送请求
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            // 检查HTTP状态码
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200...299:
                    return data // 成功，返回原始数据
                case 401:
                    throw APIError.unauthorized
                case 404:
                    throw APIError.notFound
                default:
                    throw APIError.serverError("服务器错误: \(httpResponse.statusCode)")
                }
            }
            
            return data
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }
    
    // 通用请求方法
    func request<T: Decodable>(
        _ endpoint: String,
        method: HTTPMethod = .GET,
        queryParams: [String: String]? = nil,
        body: [String: Any]? = nil,
        headers: [String: String]? = nil
    ) async throws -> T {
        // 构建URL
        var urlString = baseURL + endpoint
        
        // 添加查询参数
        if let queryParams = queryParams, !queryParams.isEmpty {
            let queryString = queryParams
                .map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0.value)" }
                .joined(separator: "&")
            urlString += "?" + queryString
        }
        
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        
        // 创建请求
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // 设置请求头
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("zh-CN", forHTTPHeaderField: "Accept-Language")
        
        // 添加认证令牌
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // 添加自定义请求头
        if let headers = headers {
            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        
        // 添加请求体
        if let body = body {
            do {
                request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
            } catch {
                throw APIError.encodingError(error)
            }
        }
        
        // 发送请求
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            // 打印响应数据用于调试
            if let responseString = String(data: data, encoding: .utf8) {
                print("Response: \(responseString)")
            }
            
            // 检查HTTP状态码
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200...299:
                    break // 成功
                case 401:
                    throw APIError.unauthorized
                case 404:
                    throw APIError.notFound
                case 400:
                    // 尝试解析错误信息
                    if let errorResponse = try? JSONDecoder().decode(APIResponse<EmptyResponse>.self, from: data) {
                        throw APIError.badRequest(errorResponse.message ?? "请求错误")
                    } else {
                        throw APIError.badRequest("请求错误")
                    }
                default:
                    // 尝试解析服务器错误信息
                    if let errorResponse = try? JSONDecoder().decode(APIResponse<EmptyResponse>.self, from: data) {
                        throw APIError.serverError(errorResponse.message ?? "服务器错误")
                    } else {
                        throw APIError.serverError("服务器错误: \(httpResponse.statusCode)")
                    }
                }
            }
            
            // 解码响应
            do {
                return try JSONDecoder.apiDecoder.decode(T.self, from: data)
            } catch {
                print("Decoding error: \(error)")
                print("Trying to decode type: \(T.self)")
                if let jsonString = String(data: data, encoding: .utf8) {
                    print("Raw data: \(jsonString)")
                }
                throw APIError.decodingError(error)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }
}
