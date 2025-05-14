// VisionProIAPManager.swift
import StoreKit
import Foundation

class VisionProIAPManager: NSObject, ObservableObject {
    
    @Published var products: [Product] = []
    @Published var purchasedSubscriptions: [Product] = []
    
    // 产品ID配置（与后端保持一致）
    private let subscriptionProductIds = [
        "com.yourdomain.visionpro.monthly",
        "com.yourdomain.visionpro.quarterly",
        "com.yourdomain.visionpro.yearly"
    ]
    
    private var productIdPrefix = "com.yourdomain.visionpro.content."
    
    override init() {
        super.init()
        Task {
            await loadProducts()
            await updatePurchasedProducts()
        }
        
        // 监听交易更新
        Task {
            for await result in Transaction.updates {
                await handleTransaction(result)
            }
        }
    }
    
    // 加载产品
    func loadProducts() async {
        do {
            products = try await Product.products(for: subscriptionProductIds)
        } catch {
            print("加载产品失败: \(error)")
        }
    }
    
    // 购买订阅
    func purchaseSubscription(_ product: Product) async throws -> Bool {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            
            // 验证收据
            if let receiptData = await getReceiptData() {
                await verifyWithBackend(
                    receiptData: receiptData,
                    productId: product.id,
                    transaction: transaction
                )
            }
            
            await transaction.finish()
            return true
            
        case .userCancelled, .pending:
            return false
            
        @unknown default:
            return false
        }
    }
    
    // 购买内容
    func purchaseContent(contentId: String, price: Decimal) async throws -> Bool {
        let productId = productIdPrefix + contentId
        
        // 动态创建产品（如果使用服务器配置的价格）
        // 注意：实际应用中，内容产品应该在App Store Connect中预先配置
        
        let result = try await Product.products(for: [productId]).first?.purchase()
        
        if let result = result {
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                
                // 验证收据
                if let receiptData = await getReceiptData() {
                    await verifyWithBackend(
                        receiptData: receiptData,
                        productId: productId,
                        transaction: transaction
                    )
                }
                
                await transaction.finish()
                return true
                
            case .userCancelled, .pending:
                return false
                
            @unknown default:
                return false
            }
        }
        
        return false
    }
    
    // 恢复购买
    func restorePurchases() async {
        do {
            if let receiptData = await getReceiptData() {
                await restoreWithBackend(receiptData: receiptData)
            }
        } catch {
            print("恢复购买失败: \(error)")
        }
    }
    
    // 处理交易
    private func handleTransaction(_ result: VerificationResult<Transaction>) async {
        do {
            let transaction = try checkVerified(result)
            
            // 如果是订阅续费，通知后端
            if transaction.productType == .autoRenewable {
                if let receiptData = await getReceiptData() {
                    await verifyWithBackend(
                        receiptData: receiptData,
                        productId: transaction.productID,
                        transaction: transaction
                    )
                }
            }
            
            await transaction.finish()
        } catch {
            print("交易处理失败: \(error)")
        }
    }
    
    // 验证交易
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    // 获取收据数据
    private func getReceiptData() async -> String? {
        guard let appStoreReceiptURL = Bundle.main.appStoreReceiptURL,
              FileManager.default.fileExists(atPath: appStoreReceiptURL.path) else {
            return nil
        }
        
        do {
            let receiptData = try Data(contentsOf: appStoreReceiptURL)
            return receiptData.base64EncodedString()
        } catch {
            print("获取收据失败: \(error)")
            return nil
        }
    }
    
    // 与后端验证收据
    private func verifyWithBackend(receiptData: String, productId: String, transaction: Transaction) async {
        guard let url = URL(string: "http://localhost:5001/api/payment/apple/verify") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 添加认证token（从用户会话获取）
        if let token = UserSession.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let body = [
            "receiptData": receiptData,
            "productId": productId
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                print("收据验证成功")
            } else {
                print("收据验证失败")
            }
        } catch {
            print("验证请求失败: \(error)")
        }
    }
    
    // 与后端恢复购买
    private func restoreWithBackend(receiptData: String) async {
        guard let url = URL(string: "http://localhost:5001/api/payment/apple/restore") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 添加认证token
        if let token = UserSession.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let body = ["receiptData": receiptData]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                print("恢复购买成功")
                await updatePurchasedProducts()
            }
        } catch {
            print("恢复购买请求失败: \(error)")
        }
    }
    
    // 更新已购买的产品
    private func updatePurchasedProducts() async {
        var purchased: [Product] = []
        
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                
                if let product = products.first(where: { $0.id == transaction.productID }) {
                    purchased.append(product)
                }
            } catch {
                print("验证失败: \(error)")
            }
        }
        
        self.purchasedSubscriptions = purchased
    }
}

// 错误类型
enum StoreError: Error {
    case failedVerification
}

// 在Vision Pro应用中使用
struct SubscriptionView: View {
    @StateObject private var iapManager = VisionProIAPManager()
    
    var body: some View {
        VStack {
            ForEach(iapManager.products) { product in
                VStack {
                    Text(product.displayName)
                    Text(product.displayPrice)
                    
                    Button("购买") {
                        Task {
                            do {
                                let success = try await iapManager.purchaseSubscription(product)
                                if success {
                                    print("购买成功")
                                }
                            } catch {
                                print("购买失败: \(error)")
                            }
                        }
                    }
                }
                .padding()
            }
            
            Button("恢复购买") {
                Task {
                    await iapManager.restorePurchases()
                }
            }
        }
    }
}
