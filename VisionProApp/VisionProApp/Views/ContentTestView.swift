//
//  ContentTestView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/ContentTestView.swift
// Views/ContentTestView.swift
import SwiftUI
import Foundation

struct ContentTestView: View {
    @State private var result = ""
    @State private var isLoading = false
    @State private var contents: [Content] = []
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("内容API测试")
                    .font(.title)
                
                // 测试按钮组
                VStack(spacing: 10) {
                    Button("1. 创建测试内容") {
                        createTestContent()
                    }
                    .buttonStyle(.borderedProminent)
                    
                    Button("2. 获取内容列表") {
                        testGetContents()
                    }
                    .buttonStyle(.bordered)
                    
                    Button("3. 直接测试API状态") {
                        checkAPIStatus()
                    }
                    .buttonStyle(.bordered)
                    
                    Button("4. 检查数据库内容") {
                        checkDatabaseContent()
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.orange)
                }
                .disabled(isLoading)
                
                if isLoading {
                    ProgressView()
                }
                
                // 结果显示
                ScrollView {
                    Text(result)
                        .font(.system(.body, design: .monospaced))
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                }
                .frame(maxHeight: 300)
                
                // 内容列表预览
                if !contents.isEmpty {
                    Divider()
                    Text("获取到的内容：")
                        .font(.headline)
                    
                    ForEach(contents) { content in
                        VStack(alignment: .leading) {
                            Text("ID: \(content.id)")
                            Text("标题: \(content.localizedTitle)")
                            Text("类型: \(content.contentType.rawValue)")
                            Text("分类: \(content.category.rawValue)")
                            Text("价格: \(content.formattedPrice)")
                            Text("创建时间: \(content.createdAt?.formatted() ?? "未知")")
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
            }
            .padding()
        }
    }
    
    func createTestContent() {
        isLoading = true
        result = "=== 创建内容测试 ===\n"
        
        Task {
            do {
                // 检查登录状态
                guard let token = NetworkManager.shared.getToken() else {
                    result += "❌ 错误：未登录，请先登录\n"
                    isLoading = false
                    return
                }
                
                result += "✓ 已登录，Token: \(token.prefix(20))...\n"
                
                // 创建内容参数
                let title = [
                    "zh-CN": "测试视频 - \(Date().formatted())",
                    "en-US": "Test Video - \(Date().formatted())"
                ]
                
                let description = [
                    "zh-CN": "这是一个测试内容",
                    "en-US": "This is a test content"
                ]
                
                let files: [String: Any] = [
                    "main": [
                        "url": "https://example.com/test-video.mp4",
                        "size": 1024000,
                        "duration": 120
                    ]
                ]
                
                let pricing: [String: Any] = [
                    "isFree": true,
                    "price": 0,
                    "currency": "CNY"
                ]
                
                result += "发送创建请求...\n"
                
                // 直接使用URLSession测试
                let createResult = try await directAPICall(
                    endpoint: "/api/contents",
                    method: "POST",
                    body: [
                        "title": title,
                        "description": description,
                        "contentType": "360_video",
                        "files": files,
                        "category": "entertainment",
                        "pricing": pricing,
                        "tags": ["测试"]
                    ]
                )
                
                result += "API响应：\n\(createResult)\n"
                
                // 也尝试使用APIClient
                let content = try await APIClient.shared.createContent(
                    title: title,
                    description: description,
                    contentType: "360_video",
                    files: files,
                    tags: ["测试"],
                    category: "entertainment",
                    pricing: pricing
                )
                
                result += "✓ 成功创建内容！\n"
                result += "ID: \(content.id)\n"
                result += "标题: \(content.localizedTitle)\n"
                
                // 等待一秒后刷新列表
                try await Task.sleep(nanoseconds: 1_000_000_000)
                result += "\n自动刷新内容列表...\n"
                await testGetContents()
                
            } catch {
                result += "❌ 创建失败！\n"
                result += "错误: \(error)\n"
                result += "错误类型: \(type(of: error))\n"
            }
            isLoading = false
        }
    }
    
    func testGetContents() {
        isLoading = true
        result += "\n=== 获取内容列表 ===\n"
        
        Task {
            do {
                // 直接API调用测试
                let listResult = try await directAPICall(
                    endpoint: "/api/contents",
                    method: "GET",
                    body: nil
                )
                
                result += "直接API响应：\n\(listResult)\n"
                
                // 使用APIClient获取
                let fetchedContents = try await APIClient.shared.getContents()
                contents = fetchedContents
                
                result += "获取到 \(fetchedContents.count) 个内容\n"
                
                if fetchedContents.isEmpty {
                    result += "⚠️ 数据库中没有内容\n"
                } else {
                    for (index, content) in fetchedContents.enumerated() {
                        result += "\(index + 1). \(content.localizedTitle) (ID: \(content.id))\n"
                    }
                }
            } catch {
                result += "❌ 获取失败！错误: \(error)\n"
            }
            isLoading = false
        }
    }
    
    func checkDatabaseContent() {
        isLoading = true
        result = "=== 检查数据库内容 ===\n"
        
        Task {
            do {
                // 直接调用后端API检查数据库
                let checkResult = try await directAPICall(
                    endpoint: "/api/contents/debug/check",
                    method: "GET",
                    body: nil
                )
                
                result += "数据库检查结果：\n\(checkResult)\n"
            } catch {
                result += "检查失败：\(error)\n"
                result += "提示：可能需要在后端添加调试端点\n"
            }
            isLoading = false
        }
    }
    
    // 直接API调用辅助函数
    func directAPICall(endpoint: String, method: String, body: [String: Any]?) async throws -> String {
        guard let url = URL(string: "http://localhost:5001\(endpoint)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = NetworkManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse {
            result += "HTTP状态码: \(httpResponse.statusCode)\n"
        }
        
        if let responseString = String(data: data, encoding: .utf8) {
            return responseString
        }
        
        return "无法解析响应"
    }
    
    func checkAPIStatus() {
        isLoading = true
        result = "=== API状态检查 ===\n"
        
        Task {
            do {
                let healthCheck = try await directAPICall(
                    endpoint: "/api/health",
                    method: "GET",
                    body: nil
                )
                
                result += "健康检查：\n\(healthCheck)\n"
                
                // 检查内容路由
                result += "\n检查内容API端点...\n"
                let contentsCheck = try await directAPICall(
                    endpoint: "/api/contents",
                    method: "GET",
                    body: nil
                )
                
                result += "内容端点响应：\n\(contentsCheck)\n"
                
            } catch {
                result += "❌ 检查失败：\(error)\n"
            }
            isLoading = false
        }
    }
}

#Preview {
    ContentTestView()
}
