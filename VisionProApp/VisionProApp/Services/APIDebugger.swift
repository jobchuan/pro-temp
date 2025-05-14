//
//  APIDebugger.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/14.
//

// APIDebugger.swift
import Foundation

class APIDebugger {
    static let shared = APIDebugger()
    
    private let baseURL = "http://localhost:5001/api"
    private var logs: [String] = []
    
    private init() {}
    
    // 测试API连接
    func testConnection() async -> String {
        do {
            let url = URL(string: "\(baseURL)/health")!
            let (data, response) = try await URLSession.shared.data(for: URLRequest(url: url))
            
            guard let httpResponse = response as? HTTPURLResponse else {
                return "❌ 无法获取HTTP响应"
            }
            
            if (200...299).contains(httpResponse.statusCode) {
                if let responseString = String(data: data, encoding: .utf8) {
                    return "✅ 服务器连接成功: \(httpResponse.statusCode)\n\(responseString)"
                } else {
                    return "✅ 服务器连接成功: \(httpResponse.statusCode) (无法解码响应)"
                }
            } else {
                return "❌ 服务器返回错误: \(httpResponse.statusCode)"
            }
        } catch {
            return "❌ 连接错误: \(error.localizedDescription)"
        }
    }
    
    // 测试登录
    func testLogin(email: String, password: String) async -> String {
        do {
            let url = URL(string: "\(baseURL)/users/login")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let body: [String: Any] = [
                "email": email,
                "password": password
            ]
            
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                return "❌ 无法获取HTTP响应"
            }
            
            if (200...299).contains(httpResponse.statusCode) {
                if let responseString = String(data: data, encoding: .utf8) {
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let success = json["success"] as? Bool,
                       success,
                       let dataObj = json["data"] as? [String: Any],
                       let token = dataObj["token"] as? String {
                        
                        UserDefaults.standard.set(token, forKey: "auth_token")
                        
                        return "✅ 登录成功: 获取到token\n(已保存到UserDefaults)\n\n前100字符: \(String(token.prefix(100)))"
                    }
                    return "✅ 登录成功，但无法解析token\n\(responseString)"
                } else {
                    return "✅ 登录成功: \(httpResponse.statusCode) (无法解码响应)"
                }
            } else {
                if let responseString = String(data: data, encoding: .utf8) {
                    return "❌ 登录失败: \(httpResponse.statusCode)\n\(responseString)"
                } else {
                    return "❌ 登录失败: \(httpResponse.statusCode) (无法解码响应)"
                }
            }
        } catch {
            return "❌ 登录错误: \(error.localizedDescription)"
        }
    }
    
    // 测试获取内容列表
    func testGetContents() async -> String {
        do {
            let url = URL(string: "\(baseURL)/contents")!
            let (data, response) = try await URLSession.shared.data(for: URLRequest(url: url))
            
            guard let httpResponse = response as? HTTPURLResponse else {
                return "❌ 无法获取HTTP响应"
            }
            
            if (200...299).contains(httpResponse.statusCode) {
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let success = json["success"] as? Bool,
                   success,
                   let dataArray = json["data"] as? [[String: Any]] {
                    
                    return "✅ 获取内容成功: 共\(dataArray.count)个内容"
                } else if let responseString = String(data: data, encoding: .utf8) {
                    return "✅ 获取内容成功，但无法解析内容列表\n\(responseString.prefix(500))"
                } else {
                    return "✅ 获取内容成功: \(httpResponse.statusCode) (无法解码响应)"
                }
            } else {
                if let responseString = String(data: data, encoding: .utf8) {
                    return "❌ 获取内容失败: \(httpResponse.statusCode)\n\(responseString)"
                } else {
                    return "❌ 获取内容失败: \(httpResponse.statusCode) (无法解码响应)"
                }
            }
        } catch {
            return "❌ 获取内容错误: \(error.localizedDescription)"
        }
    }
    
    // 测试获取用户信息
    func testGetUserInfo() async -> String {
        guard let token = UserDefaults.standard.string(forKey: "auth_token") else {
            return "❌ 未找到认证token，请先登录"
        }
        
        do {
            let url = URL(string: "\(baseURL)/users/me")!
            var request = URLRequest(url: url)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                return "❌ 无法获取HTTP响应"
            }
            
            if (200...299).contains(httpResponse.statusCode) {
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let success = json["success"] as? Bool,
                   success,
                   let dataObj = json["data"] as? [String: Any],
                   let user = dataObj["user"] as? [String: Any] {
                    
                    let username = user["username"] as? String ?? "未知"
                    let email = user["email"] as? String ?? "未知"
                    let role = user["role"] as? String ?? "未知"
                    
                    return "✅ 获取用户信息成功:\n用户名: \(username)\n邮箱: \(email)\n角色: \(role)"
                } else if let responseString = String(data: data, encoding: .utf8) {
                    return "✅ 获取用户信息成功，但无法解析\n\(responseString.prefix(500))"
                } else {
                    return "✅ 获取用户信息成功: \(httpResponse.statusCode) (无法解码响应)"
                }
            } else {
                if let responseString = String(data: data, encoding: .utf8) {
                    return "❌ 获取用户信息失败: \(httpResponse.statusCode)\n\(responseString)"
                } else {
                    return "❌ 获取用户信息失败: \(httpResponse.statusCode) (无法解码响应)"
                }
            }
        } catch {
            return "❌ 获取用户信息错误: \(error.localizedDescription)"
        }
    }
    
    // 记录API调用日志
    func logAPICall(_ method: String, url: String, requestBody: Any? = nil, response: Any? = nil, error: Error? = nil) {
        var logEntry = "[\(Date())] \(method) \(url)\n"
        
        if let requestBody = requestBody {
            logEntry += "请求体: \(requestBody)\n"
        }
        
        if let response = response {
            logEntry += "响应: \(response)\n"
        }
        
        if let error = error {
            logEntry += "错误: \(error.localizedDescription)\n"
        }
        
        logEntry += "-----------------------------------\n"
        
        logs.append(logEntry)
        print(logEntry)
    }
    
    // 获取日志
    func getLogs() -> String {
        return logs.joined()
    }
    
    // 清除日志
    func clearLogs() {
        logs.removeAll()
    }
}

// 调试视图
struct APIDebugView: View {
    @State private var debugResult = "点击按钮测试API连接"
    @State private var email = "creator@example.com"
    @State private var password = "123456"
    
    var body: some View {
        VStack(spacing: 20) {
            Text("API调试工具")
                .font(.title)
                .fontWeight(.bold)
            
            // 测试连接按钮
            Button("测试API连接") {
                Task {
                    debugResult = "正在测试连接..."
                    debugResult = await APIDebugger.shared.testConnection()
                }
            }
            .buttonStyle(.borderedProminent)
            
            // 登录测试区域
            VStack(spacing: 10) {
                TextField("邮箱", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .autocapitalization(.none)
                
                SecureField("密码", text: $password)
                    .textFieldStyle(.roundedBorder)
                
                Button("测试登录") {
                    Task {
                        debugResult = "正在测试登录..."
                        debugResult = await APIDebugger.shared.testLogin(email: email, password: password)
                    }
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.secondary.opacity(0.1))
            )
            
            // 其他测试按钮
            HStack(spacing: 20) {
                Button("测试获取用户信息") {
                    Task {
                        debugResult = "正在获取用户信息..."
                        debugResult = await APIDebugger.shared.testGetUserInfo()
                    }
                }
                .buttonStyle(.bordered)
                
                Button("测试获取内容列表") {
                    Task {
                        debugResult = "正在获取内容列表..."
                        debugResult = await APIDebugger.shared.testGetContents()
                    }
                }
                .buttonStyle(.bordered)
            }
            
            // 结果显示区域
            ScrollView {
                Text(debugResult)
                    .font(.system(.body, design: .monospaced))
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.secondary.opacity(0.1))
                    )
            }
            .frame(maxHeight: 300)
        }
        .padding()
    }
}
