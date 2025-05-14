//
//  APIError.swift
//  VisionProApp
//
//  Created on 2025/5/11.
//
// Utils/APIError.swift
import Foundation

// API错误类型定义
enum APIError: Error, LocalizedError {
    case networkError(Error)
    case serverError(String)
    case decodingError(Error)
    case invalidResponse
    case unauthorized
    case notFound
    case badRequest(String)
    case unknown
    case invalidURL
    case invalidParameters
    case noData
    case encodingError(Error)
    case responseParsingError(String)
    
    var errorDescription: String? {
        switch self {
        case .networkError(let error):
            return "网络错误: \(error.localizedDescription)"
        case .serverError(let message):
            return message
        case .decodingError(let error):
            return "数据解析错误: \(error.localizedDescription)"
        case .invalidResponse:
            return "无效的服务器响应"
        case .unauthorized:
            return "未授权访问"
        case .notFound:
            return "请求的资源不存在"
        case .badRequest(let message):
            return "请求错误: \(message)"
        case .unknown:
            return "未知错误"
        case .invalidURL:
            return "无效的URL"
        case .invalidParameters:
            return "无效的参数"
        case .noData:
            return "没有数据"
        case .encodingError(let error):
            return "数据编码错误: \(error.localizedDescription)"
        case .responseParsingError(let message):
            return "响应解析错误: \(message)"
        }
    }
}

// 网络错误类型定义
enum NetworkError: Error, LocalizedError {
    case networkError
    case badRequest(String)
    case unauthorized
    case forbidden
    case notFound
    case serverError(String)
    case decodingError(Error)
    case authenticationFailed(String)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .networkError:
            return "网络连接失败"
        case .badRequest(let message):
            return message
        case .unauthorized:
            return "未授权访问"
        case .forbidden:
            return "禁止访问"
        case .notFound:
            return "资源不存在"
        case .serverError(let message):
            return message
        case .decodingError(let error):
            return "数据解析错误: \(error.localizedDescription)"
        case .authenticationFailed(let message):
            return message
        case .unknown:
            return "未知错误"
        }
    }
}
