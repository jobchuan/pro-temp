import SwiftUI

struct SimpleLoginTest: View {
    @State private var email = "138991386@qq.com"
    @State private var password = ""
    @State private var result = ""
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("简单登录测试")
                .font(.title)
            
            TextField("邮箱", text: $email)
                .textFieldStyle(.roundedBorder)
            
            SecureField("密码", text: $password)
                .textFieldStyle(.roundedBorder)
            
            Button("登录") {
                performLogin()
            }
            .buttonStyle(.borderedProminent)
            .disabled(isLoading)
            
            if isLoading {
                ProgressView()
            }
            
            ScrollView {
                Text(result)
                    .font(.system(.body, design: .monospaced))
                    .padding()
            }
        }
        .padding()
    }
    
    func performLogin() {
        isLoading = true
        result = ""
        
        Task {
            do {
                // 使用 APIClient 登录
                let response = try await APIClient.shared.login(email: email, password: password)
                
                // 保存 token
                NetworkManager.shared.setToken(response.token)
                
                result = """
                ✓ 登录成功！
                用户名: \(response.user.username)
                邮箱: \(response.user.email)
                Token: \(response.token.prefix(20))...
                """
                
                // 设置 AuthManager 状态
                await AuthManager.shared.setUser(response.user)
                
            } catch {
                result = """
                ❌ 登录失败
                错误: \(error)
                类型: \(type(of: error))
                """
                
                // 如果是解码错误，提供更多细节
                if let decodingError = error as? DecodingError {
                    result += "\n\n解码错误详情: \(decodingError)"
                }
            }
            
            isLoading = false
        }
    }
}

// 更新 AuthManager 以支持手动设置用户
extension AuthManager {
    func setUser(_ user: User) async {
        await MainActor.run {
            self.currentUser = user
            self.isAuthenticated = true
        }
    }
}

#Preview {
    SimpleLoginTest()
}
