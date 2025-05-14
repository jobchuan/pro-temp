//
//  RegisterView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Auth/RegisterView.swift
import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var authManager = AuthManager.shared
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Logo
                    Image(systemName: "visionpro")
                        .font(.system(size: 60))
                        .foregroundColor(.accentColor)
                        .padding(.top, 20)
                    
                    Text("创建新账户")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    // 输入框
                    VStack(spacing: 15) {
                        // 用户名输入
                        VStack(alignment: .leading, spacing: 5) {
                            Label("用户名", systemImage: "person")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            TextField("请输入用户名", text: $username)
                                .textFieldStyle(.roundedBorder)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        
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
                        
                        // 确认密码
                        VStack(alignment: .leading, spacing: 5) {
                            Label("确认密码", systemImage: "lock.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            SecureField("请再次输入密码", text: $confirmPassword)
                                .textFieldStyle(.roundedBorder)
                        }
                    }
                    .padding(.horizontal)
                    
                    // 密码要求提示
                    VStack(alignment: .leading, spacing: 5) {
                        Text("密码要求：")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("• 至少6个字符")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    
                    // 注册按钮
                    Button {
                        handleRegister()
                    } label: {
                        if authManager.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("注册")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(isFormValid ? Color.accentColor : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .padding(.horizontal)
                    .disabled(!isFormValid || authManager.isLoading)
                    
                    // 服务条款
                    Text("注册即表示您同意我们的服务条款和隐私政策")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    Spacer()
                }
            }
            .navigationTitle("注册")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }
            }
            .alert("注册失败", isPresented: $showError) {
                Button("确定") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private var isFormValid: Bool {
        !username.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        password.count >= 6 &&
        password == confirmPassword &&
        email.contains("@")
    }
    
    private func handleRegister() {
        guard isFormValid else { return }
        
        Task {
            do {
                try await authManager.register(
                    username: username,
                    email: email,
                    password: password
                )
                // 注册成功，AuthManager会自动更新状态
                dismiss()
            } catch {
                errorMessage = ErrorHelper.parseRegisterError(error)
                showError = true
            }
        }
    }
}

#Preview {
    RegisterView()
}
