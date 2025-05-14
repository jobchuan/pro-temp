//
//  LoginView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Auth/LoginView.swift
import SwiftUI

struct LoginView: View {
    @StateObject private var authManager = AuthManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showRegister = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Logo
                    Image(systemName: "visionpro")
                        .font(.system(size: 80))
                        .foregroundColor(.accentColor)
                        .padding(.top, 40)
                    
                    Text("Vision Pro Platform")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("登录您的账户")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    
                    // 输入框
                    VStack(spacing: 15) {
                        // 邮箱输入
                        VStack(alignment: .leading, spacing: 5) {
                            Label("邮箱", systemImage: "envelope")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            TextField("请输入邮箱", text: $email)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        
                        // 密码输入
                        VStack(alignment: .leading, spacing: 5) {
                            Label("密码", systemImage: "lock")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            SecureField("请输入密码", text: $password)
                                .textFieldStyle(.roundedBorder)
                        }
                    }
                    .padding(.horizontal)
                    
                    // 登录按钮
                    Button {
                        handleLogin()
                    } label: {
                        if authManager.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("登录")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .padding(.horizontal)
                    .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
                    
                    // 忘记密码
                    Button("忘记密码？") {
                        // TODO: 实现忘记密码功能
                    }
                    .font(.subheadline)
                    .foregroundColor(.accentColor)
                    
                    Divider()
                        .padding(.vertical)
                    
                    // 注册按钮
                    VStack(spacing: 10) {
                        Text("还没有账户？")
                            .foregroundColor(.secondary)
                        
                        Button("注册新账户") {
                            showRegister = true
                        }
                        .fontWeight(.semibold)
                        .foregroundColor(.accentColor)
                    }
                    
                    Spacer()
                }
            }
            .navigationBarHidden(true)
            .alert("登录失败", isPresented: $showError) {
                Button("确定") { }
            } message: {
                Text(errorMessage)
            }
            .sheet(isPresented: $showRegister) {
                RegisterView()
            }
        }
    }
    
    private func handleLogin() {
        Task {
            do {
                try await authManager.login(email: email, password: password)
                // 登录成功，AuthManager会自动更新状态
            } catch {
                errorMessage = ErrorHelper.parseLoginError(error)
                showError = true
            }
        }
    }
}

#Preview {
    LoginView()
}
