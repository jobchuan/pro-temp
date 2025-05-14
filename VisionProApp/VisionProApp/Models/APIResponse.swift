//
//  APIResponse.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Models/APIResponse.swift
import Foundation

// 通用API响应包装
struct APIResponse<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: String?
    let message: String?
}

// 分页信息
struct Pagination: Decodable {
    let page: Int
    let limit: Int
    let total: Int
    let pages: Int
}

// 带分页的响应
struct PaginatedResponse<T: Decodable>: Decodable {
    let items: [T]
    let pagination: Pagination
}

// 内容列表的分页响应（后端返回的是 contents 字段）
struct ContentsPaginatedResponse: Decodable {
    let contents: [Content]
    let pagination: Pagination
}

// 登录响应
struct LoginResponse: Decodable {
    let user: User
    let token: String
    
    enum CodingKeys: String, CodingKey {
        case user
        case token
    }
}

// 另一种可能的登录响应格式
struct LoginData: Decodable {
    let user: User
    let token: String
}

// 登录响应包装器
struct LoginResponseWrapper: Decodable {
    let success: Bool
    let data: LoginData?
    let message: String?
}
//登陆返回

// 上传响应
struct UploadResponse: Decodable {
    let fileId: String
    let fileName: String
    let fileType: String
    let url: String
    let thumbnailPath: String?
    let size: Int?
    
    enum CodingKeys: String, CodingKey {
        case fileId
        case fileName
        case fileType
        case url
        case thumbnailPath
        case size
    }
}

// 支付响应
struct PaymentResponse: Decodable {
    let orderNo: String
    let amount: Double
    let paymentParams: PaymentParams
}

struct PaymentParams: Decodable {
    let method: String
    let productId: String?
    let orderStr: String?
    let clientSecret: String?
}

// 错误响应
struct ErrorResponse: Decodable, Error, LocalizedError {
    let error: String
    let message: String
    let code: String?
    
    var errorDescription: String? {
        return message
    }
}
// 空响应结构体 - 用于没有返回数据的API
struct EmptyResponse: Decodable {}

