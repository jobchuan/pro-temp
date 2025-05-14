//
//  InteractionModels.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//

import Foundation

// MARK: - 交互状态
struct InteractionStatus: Codable {
    let liked: Bool
    let favorited: Bool
}

// MARK: - 观看历史
struct ViewHistory: Codable, Identifiable {
    let id: String
    let userId: String
    let contentId: String
    let progress: TimeInterval
    let duration: TimeInterval
    let progressPercentage: Double
    let isCompleted: Bool
    let viewCount: Int
    let lastPosition: LastViewPosition?
    let deviceInfo: String?
    let lastViewedAt: Date
    let contentInfo: ContentSummary?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case userId, contentId, progress, duration
        case progressPercentage, isCompleted, viewCount
        case lastPosition, deviceInfo, lastViewedAt, contentInfo
    }
}

struct LastViewPosition: Codable {
    let x: Double
    let y: Double
    let z: Double
    let timestamp: TimeInterval?
}

struct ContentSummary: Codable {
    let title: [String: String]
    let contentType: String
    let thumbnail: String?
    let creatorId: String
    let creatorName: String?
}

// MARK: - 离线内容
struct OfflineContent: Codable, Identifiable {
    let id: String
    let userId: String
    let contentId: String
    let status: OfflineStatus
    let progress: Double
    let files: OfflineFiles
    let totalSize: Int64
    let downloadedSize: Int64
    let quality: String
    let expiresAt: Date
    let error: OfflineError?
    let startedAt: Date?
    let completedAt: Date?
    let lastAccessedAt: Date
    let metadata: OfflineMetadata
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case userId, contentId, status, progress
        case files, totalSize, downloadedSize, quality
        case expiresAt, error, startedAt, completedAt
        case lastAccessedAt, metadata
    }
}

enum OfflineStatus: String, Codable {
    case pending, downloading, completed, failed, expired
}

struct OfflineFiles: Codable {
    let main: OfflineFile
    let thumbnail: OfflineFile?
    let audio: OfflineFile?
}

struct OfflineFile: Codable {
    let url: String
    let size: Int64?
    let downloadedSize: Int64?
    let checksum: String?
}

struct OfflineError: Codable {
    let code: String
    let message: String
}

struct OfflineMetadata: Codable {
    let title: [String: String]
    let description: [String: String]?
    let duration: TimeInterval?
    let contentType: String
    let thumbnailURL: String?
}

// MARK: - 弹幕
struct Danmaku: Codable, Identifiable {
    let id: String
    let contentId: String
    let userId: String
    let text: String
    let timestamp: TimeInterval
    let type: DanmakuType
    let style: DanmakuStyle?
    let spatialPosition: SpatialPosition?
    let speed: Double
    let status: String
    let likes: Int
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case contentId, userId, text, timestamp
        case type, style, spatialPosition, speed
        case status, likes, createdAt
    }
}

enum DanmakuType: String, Codable {
    case scroll, top, bottom, spatial
}

struct DanmakuStyle: Codable {
    let color: String
    let fontSize: FontSize
    let opacity: Double
    
    enum FontSize: String, Codable {
        case small, medium, large
    }
}

struct SpatialPosition: Codable {
    let x: Double
    let y: Double
    let z: Double
    let rx: Double?
    let ry: Double?
    let rz: Double?
}
