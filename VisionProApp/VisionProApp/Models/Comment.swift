//
//  Comment.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//

import Foundation

struct Comment: Codable, Identifiable {
    let id: String
    let contentId: String
    let userId: CommentUserId
    let text: String
    let spatialAnchor: SpatialAnchor?
    let parentId: String?
    let level: Int
    let status: String
    let likes: Int
    let replyCount: Int
    let isPinned: Bool
    let isCreatorComment: Bool
    let createdAt: Date
    let updatedAt: Date
    let user: CommentUser?
    let replies: [Comment]?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case contentId
        case userId
        case text
        case spatialAnchor
        case parentId
        case level
        case status
        case likes
        case replyCount
        case isPinned
        case isCreatorComment
        case createdAt
        case updatedAt
        case user
        case replies
    }
}

// userId 可能是字符串或对象
enum CommentUserId: Codable {
    case string(String)
    case object(UserObject)
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let stringValue = try? container.decode(String.self) {
            self = .string(stringValue)
        } else if let objectValue = try? container.decode(UserObject.self) {
            self = .object(objectValue)
        } else {
            throw DecodingError.typeMismatch(CommentUserId.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Expected string or user object"))
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        }
    }
    
    var id: String {
        switch self {
        case .string(let id):
            return id
        case .object(let user):
            return user._id
        }
    }
}

struct UserObject: Codable {
    let _id: String
    let username: String
    let profile: CommentUserProfile?
}

struct CommentUserProfile: Codable {
    let displayName: [String: String]?
}

// 评论用户信息
struct CommentUser: Codable {
    let id: String
    let username: String
    let displayName: [String: String]?
    let avatarURL: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case username
        case displayName
        case avatarURL
    }
}

// 空间锚点
struct SpatialAnchor: Codable {
    let position: Position3D
    let rotation: Rotation3D
    let timestamp: TimeInterval?
}

struct Position3D: Codable {
    let x: Double
    let y: Double
    let z: Double
}

struct Rotation3D: Codable {
    let x: Double
    let y: Double
    let z: Double
    let w: Double
}
