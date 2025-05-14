//
//  VisionProAppApp.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//

// VisionProApp.swift

import SwiftUI
/*//直接可查看到内容
@main
struct VisionProAppApp: App {
    var body: some Scene {
        WindowGroup {
            MainTabView()
        }
    }
}
*/
//原始先登陆再查看内容
@main
struct VisionProAppApp: App {
    @StateObject private var authManager = AuthManager.shared
    
    var body: some Scene {
        WindowGroup {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
    }
}
