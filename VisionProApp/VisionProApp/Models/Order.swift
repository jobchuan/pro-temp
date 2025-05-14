//
//  Order.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Models/Order.swift
import Foundation

struct Order: Codable, Identifiable {
    let id: String
    let orderNo: String
    let userId: String
    let orderType: OrderType
    let relatedId: String?
    let amount: Double
    let currency: String
    let paymentMethod: PaymentMethod
    let paymentStatus: PaymentStatus
    let description: String?
    let transactionId: String?
    let paidAt: Date?
    let createdAt: Date
    let updatedAt: Date
    
    enum OrderType: String, Codable {
        case subscription = "subscription"
        case content = "content"
        case tip = "tip"
    }
    
    enum PaymentMethod: String, Codable {
        case alipay = "alipay"
        case wechat = "wechat"
        case stripe = "stripe"
        case applePay = "apple_pay"
        case appleIAP = "apple_iap"
    }
    
    enum PaymentStatus: String, Codable {
        case pending = "pending"
        case paid = "paid"
        case failed = "failed"
        case cancelled = "cancelled"
        case refunded = "refunded"
    }
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case orderNo
        case userId
        case orderType
        case relatedId
        case amount
        case currency
        case paymentMethod
        case paymentStatus
        case description
        case transactionId
        case paidAt
        case createdAt
        case updatedAt
    }
    
    var formattedAmount: String {
        return "\(currency) \(String(format: "%.2f", amount))"
    }
    
    var paymentMethodDisplayName: String {
        switch paymentMethod {
        case .alipay:
            return "支付宝"
        case .wechat:
            return "微信支付"
        case .stripe:
            return "信用卡"
        case .applePay:
            return "Apple Pay"
        case .appleIAP:
            return "Apple内购"
        }
    }
    
    var statusDisplayName: String {
        switch paymentStatus {
        case .pending:
            return "待支付"
        case .paid:
            return "已支付"
        case .failed:
            return "支付失败"
        case .cancelled:
            return "已取消"
        case .refunded:
            return "已退款"
        }
    }
}
