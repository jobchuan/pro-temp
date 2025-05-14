//
//  Subscription.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Models/Subscription.swift
import Foundation

struct Subscription: Codable, Identifiable {
    let id: String
    let userId: String
    let planId: String
    let planName: String
    let planPrice: Double
    let planDuration: Int
    let status: SubscriptionStatus
    let startDate: Date
    let endDate: Date
    let autoRenew: Bool
    let nextBillingDate: Date?
    let cancelledAt: Date?
    
    enum SubscriptionStatus: String, Codable {
        case active = "active"
        case expired = "expired"
        case cancelled = "cancelled"
        case paused = "paused"
    }
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case userId
        case planId
        case planName
        case planPrice
        case planDuration
        case status
        case startDate
        case endDate
        case autoRenew
        case nextBillingDate
        case cancelledAt
    }
    
    var isActive: Bool {
        return status == .active && endDate > Date()
    }
    
    var daysRemaining: Int {
        guard isActive else { return 0 }
        return Calendar.current.dateComponents([.day], from: Date(), to: endDate).day ?? 0
    }
    
    var planDisplayName: String {
        switch planId {
        case "monthly":
            return "月度会员"
        case "quarterly":
            return "季度会员"
        case "yearly":
            return "年度会员"
        default:
            return planName
        }
    }
}

// 订阅计划
struct SubscriptionPlan: Identifiable {
    let id: String
    let name: String
    let price: Double
    let currency: String
    let duration: Int // 天数
    let features: [String]
    let appleProductId: String?
    
    static let plans = [
        SubscriptionPlan(
            id: "monthly",
            name: "月度会员",
            price: 29.9,
            currency: "CNY",
            duration: 30,
            features: [
                "无限观看VR内容",
                "独家会员内容",
                "高清画质",
                "无广告体验"
            ],
            appleProductId: "com.yourdomain.visionpro.monthly"
        ),
        SubscriptionPlan(
            id: "quarterly",
            name: "季度会员",
            price: 79.9,
            currency: "CNY",
            duration: 90,
            features: [
                "无限观看VR内容",
                "独家会员内容",
                "高清画质",
                "无广告体验",
                "优先体验新功能"
            ],
            appleProductId: "com.yourdomain.visionpro.quarterly"
        ),
        SubscriptionPlan(
            id: "yearly",
            name: "年度会员",
            price: 299.9,
            currency: "CNY",
            duration: 365,
            features: [
                "无限观看VR内容",
                "独家会员内容",
                "高清画质",
                "无广告体验",
                "优先体验新功能",
                "专属客服支持"
            ],
            appleProductId: "com.yourdomain.visionpro.yearly"
        )
    ]
}
