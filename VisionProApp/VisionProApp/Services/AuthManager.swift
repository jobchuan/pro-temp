//
//  AuthManager.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Services/AuthManager.swift
import Foundation
import SwiftUI

class AuthManager: ObservableObject {
    static let shared = AuthManager()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    
    private init() {
        // 检查是否有保存的token
        checkAuthStatus()
    }
    
    func checkAuthStatus() {
        if NetworkManager.shared.getToken() != nil {
            // 有token，尝试获取用户信息
            Task {
                await fetchCurrentUser()
            }
        }
    }
    
    func login(email: String, password: String) async throws {
        await MainActor.run {
            isLoading = true
        }
        
        do {
            let response = try await APIClient.shared.login(email: email, password: password)
            
            // 保存token
            NetworkManager.shared.setToken(response.token)
            
            // 更新状态
            await MainActor.run {
                self.currentUser = response.user
                self.isAuthenticated = true
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
            }
            throw error
        }
    }
    
    func register(username: String, email: String, password: String) async throws {
        await MainActor.run {
            isLoading = true
        }
        
        do {
            let response = try await APIClient.shared.register(
                username: username,
                email: email,
                password: password
            )
            
            // 保存token
            NetworkManager.shared.setToken(response.token)
            
            // 更新状态
            await MainActor.run {
                self.currentUser = response.user
                self.isAuthenticated = true
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
            }
            throw error
        }
    }
    
    func logout() {
        NetworkManager.shared.setToken(nil)
        currentUser = nil
        isAuthenticated = false
    }
    
    func fetchCurrentUser() async {
        do {
            let user = try await APIClient.shared.getCurrentUser()
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
            }
        } catch {
            // Token可能过期了
            await MainActor.run {
                self.logout()
            }
        }
    }
}
