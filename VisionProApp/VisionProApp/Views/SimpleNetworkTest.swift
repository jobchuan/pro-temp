//
//  SimpleNetworkTest.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/SimpleNetworkTest.swift
import SwiftUI

struct SimpleNetworkTest: View {
    @State private var result = ""
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("简单网络测试")
                .font(.title)
            
            Button("直接测试API") {
                testDirectAPI()
            }
            .buttonStyle(.borderedProminent)
            .disabled(isLoading)
            
            Button("测试登录") {
                testLogin()
            }
            .buttonStyle(.bordered)
            .disabled(isLoading)
            
            if isLoading {
                ProgressView()
            }
            
            ScrollView {
                Text(result)
                    .font(.system(.body, design: .monospaced))
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.gray.opacity(0.5))
                    .cornerRadius(8)
            }
        }
        .padding()
    }
    
    func testDirectAPI() {
            isLoading = true
            result = "正在发送请求..."
            
            Task {
                do {
                    // 改为测试health端点
                    guard let url = URL(string: "http://localhost:5001/api/health") else {
                        result = "URL错误"
                        isLoading = false
                        return
                    }
                    
                    var request = URLRequest(url: url)
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("zh-CN", forHTTPHeaderField: "Accept-Language")
                    
                    let (data, response) = try await URLSession.shared.data(for: request)
                    
                    if let httpResponse = response as? HTTPURLResponse {
                        result += "\n状态码: \(httpResponse.statusCode)"
                        
                        // 打印所有响应头
                        result += "\n\n响应头:"
                        for (key, value) in httpResponse.allHeaderFields {
                            result += "\n  \(key): \(value)"
                        }
                    }
                    
                    if let jsonString = String(data: data, encoding: .utf8) {
                        result += "\n\n响应内容:\n\(jsonString)"
                        
                        // 尝试解析为字典查看结构
                        if let jsonData = jsonString.data(using: .utf8),
                           let jsonObject = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                            result += "\n\n解析后的结构:"
                            for (key, value) in jsonObject {
                                result += "\n  \(key): \(type(of: value)) = \(value)"
                            }
                        }
                    }
                } catch {
                    result = "错误: \(error)"
                }
                isLoading = false
            }
        }
    
    func testLogin() {
            isLoading = true
            result = "正在测试登录..."
            
            Task {
                do {
                    guard let url = URL(string: "http://localhost:5001/api/users/login") else {
                        result = "URL错误"
                        isLoading = false
                        return
                    }
                    
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("zh-CN", forHTTPHeaderField: "Accept-Language")
                    
                    let loginData = [
                        "email": "test4@example.com",
                        "password": "123456"
                    ]
                    
                    request.httpBody = try JSONSerialization.data(withJSONObject: loginData)
                    
                    let (data, response) = try await URLSession.shared.data(for: request)
                    
                    if let httpResponse = response as? HTTPURLResponse {
                        result += "\n状态码: \(httpResponse.statusCode)"
                    }
                    
                    if let jsonString = String(data: data, encoding: .utf8) {
                        result += "\n响应内容:\n\(jsonString)"
                        
                        // 尝试解析为字典查看结构
                        if let jsonData = jsonString.data(using: .utf8),
                           let jsonObject = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                            result += "\n\n解析后的结构:"
                            for (key, value) in jsonObject {
                                result += "\n  \(key): \(type(of: value)) = \(value)"
                            }
                        }
                    }
                    
                    // 尝试用我们的解码器解析
                    result += "\n\n尝试用APIResponse解析:"
                    do {
                        let apiResponse = try JSONDecoder.apiDecoder.decode(APIResponse<LoginResponse>.self, from: data)
                        result += "\n成功: \(apiResponse.success)"
                        result += "\n数据: \(String(describing: apiResponse.data))"
                    } catch let decodingError {
                        result += "\n解码失败: \(decodingError)"
                    }
                    
                } catch {
                    result = "错误: \(error)"
                }
                isLoading = false
            }
        }
}

#Preview {
    SimpleNetworkTest()
}
