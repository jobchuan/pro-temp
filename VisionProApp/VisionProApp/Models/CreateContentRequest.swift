//
//  CreateContentRequest.swift
//  VisionProApp
//
//  Created on 2025/5/11.
//
// Models/CreateContentRequest.swift
import Foundation

// 如果你需要创建内容的请求模型，使用字典格式而不是强类型
// 因为创建内容时的数据结构与响应的结构可能不同
struct CreateContentRequest {
    let title: [String: String]
    let description: [String: String]?
    let contentType: String
    let files: [String: Any]
    let tags: [String]?
    let category: String
    let pricing: [String: Any]
    
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "title": title,
            "contentType": contentType,
            "files": files,
            "category": category,
            "pricing": pricing
        ]
        
        if let description = description {
            dict["description"] = description
        }
        
        if let tags = tags {
            dict["tags"] = tags
        }
        
        return dict
    }
}
