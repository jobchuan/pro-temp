//
//  Content.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Models/Content.swift
import Foundation

// 创作者信息
struct Creator: Codable {
    let id: String
    let username: String
    let email: String?
    let profile: Profile?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case username
        case email
        case profile
    }
}

struct Profile: Codable {
    let displayName: [String: String]?
    let bio: [String: String]?
}

struct Content: Codable, Identifiable, Hashable {
    let id: String
    let title: [String: String]
    let description: [String: String]?
    let contentType: ContentType
    let files: ContentFiles
    let media: ContentMedia?
    let location: Location?
    let creatorId: Creator
    let tags: [String]?
    let category: ContentCategory
    let pricing: Pricing
    let stats: ContentStats
    let status: ContentStatus
    let thumbnailURL: String?
    let createdAt: Date?
    let updatedAt: Date?
    
    enum ContentType: String, Codable, CaseIterable {
        case video180 = "180_video"
        case photo180 = "180_photo"
        case video360 = "360_video"
        case photo360 = "360_photo"
        case spatialVideo = "spatial_video"
        case spatialPhoto = "spatial_photo"
    }
    
    enum ContentCategory: String, Codable, CaseIterable {
        case travel = "travel"
        case education = "education"
        case entertainment = "entertainment"
        case sports = "sports"
        case news = "news"
        case documentary = "documentary"
        case art = "art"
        case other = "other"
    }
    
    enum ContentStatus: String, Codable {
        case draft = "draft"
        case pendingReview = "pending_review"
        case approved = "approved"
        case rejected = "rejected"
        case published = "published"
        case archived = "archived"
    }
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case title
        case description
        case contentType
        case files
        case media
        case location
        case creatorId
        case tags
        case category
        case pricing
        case stats
        case status
        case thumbnailURL
        case createdAt
        case updatedAt
    }
    
    // Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Content, rhs: Content) -> Bool {
        lhs.id == rhs.id
    }
}

struct ContentFiles: Codable {
    let main: MainFile
    let thumbnail: FileInfo?
    let preview: FileInfo?
}

struct MainFile: Codable {
    let url: String
    let size: Int?
    let duration: Int?
    let resolution: Resolution?
}

struct FileInfo: Codable {
    let url: String
    let size: Int?
}

struct Resolution: Codable {
    let width: Int
    let height: Int
}

struct ContentMedia: Codable {
    let backgroundMusic: BackgroundMusic?
    let narration: [String: Narration]?
}

struct BackgroundMusic: Codable {
    let url: String
    let title: String?
    let artist: String?
}

struct Narration: Codable {
    let url: String
}

struct Location: Codable {
    let latitude: Double
    let longitude: Double
    let altitude: Double?
    let address: String?
    let country: String?
    let city: String?
}

struct Pricing: Codable {
    let isFree: Bool
    let price: Double?
    let currency: String?
}

struct ContentStats: Codable {
    let views: Int
    let likes: Int
    let favorites: Int
    let comments: Int
    let shares: Int
    let downloads: Int
    let danmakus: Int
}

// 扩展用于便捷访问
extension Content {
    var localizedTitle: String {
        let lang = Locale.current.language.languageCode?.identifier ?? "zh-CN"
        return title[lang] ?? title["zh-CN"] ?? ""
    }
    
    var localizedDescription: String {
        let lang = Locale.current.language.languageCode?.identifier ?? "zh-CN"
        return description?[lang] ?? description?["zh-CN"] ?? ""
    }
    
    var isPaid: Bool {
        return !pricing.isFree
    }
    
    var formattedPrice: String {
        if pricing.isFree {
            return "免费"
        }
        let price = pricing.price ?? 0
        let currency = pricing.currency ?? "CNY"
        return "\(currency) \(String(format: "%.2f", price))"
    }
    
    var isVideo: Bool {
        return contentType == .video180 || contentType == .video360 || contentType == .spatialVideo
    }
    
    var isPhoto: Bool {
        return contentType == .photo180 || contentType == .photo360 || contentType == .spatialPhoto
    }
}
