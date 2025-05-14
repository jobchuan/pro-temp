//
//  User.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Models/User.swift
import Foundation

struct User: Codable, Identifiable {
    let id: String
    let username: String
    let email: String
    let role: UserRole
    let preferredLanguage: String
    let subscriptionStatus: SubscriptionStatus?
    let profile: UserProfile?
    let creatorInfo: CreatorInfo?
    let avatarURL: String?
    let status: String?
    let createdAt: Date?
    let updatedAt: Date?
    let lastLoginAt: Date?
    
    enum UserRole: String, Codable {
        case user = "user"
        case creator = "creator"
        case admin = "admin"
    }
    
    enum SubscriptionStatus: String, Codable {
        case free = "free"
        case premium = "premium"
    }
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case username
        case email
        case role
        case preferredLanguage
        case subscriptionStatus = "subscription_status"
        case profile
        case creatorInfo
        case avatarURL
        case status
        case createdAt
        case updatedAt
        case lastLoginAt
    }
}

struct UserProfile: Codable {
    let displayName: [String: String]?
    let bio: [String: String]?
}

struct CreatorInfo: Codable {
    let isVerified: Bool
    let totalFollowers: Int
    let totalViews: Int
    let totalEarnings: Double
}

// 扩展用于便捷访问
extension User {
    var displayName: String {
        let lang = preferredLanguage
        return profile?.displayName?[lang] ?? username
    }
    
    var isCreator: Bool {
        return role == .creator
    }
    
    var isPremium: Bool {
        return subscriptionStatus == .premium
    }
}
