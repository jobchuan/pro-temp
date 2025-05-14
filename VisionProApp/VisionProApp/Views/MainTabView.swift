//
//  MainTabView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/MainTabView.swift
import SwiftUI

struct MainTabView: View {
    @StateObject private var authManager = AuthManager.shared
    
    var body: some View {
        TabView {
            // 首页
            NavigationStack {
                ContentListView()
            }
            .tabItem {
                Label("首页", systemImage: "house.fill")
            }
            
            // 发现
            NavigationStack {
                ImmersiveContentCarouselView()
            }
            .tabItem {
                Label("发现", systemImage: "magnifyingglass")
            }
            
            // 个人中心
            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("我的", systemImage: "person.fill")
            }
            // 测试中心
            NavigationStack {
                ContentView()
            }
            .tabItem {
                Label("测试", systemImage: "person.fill")
            }
        }
    }
}

// 临时占位视图
struct DiscoverView: View {
    var body: some View {
        VStack {
            Text("发现")
                .font(.largeTitle)
            Text("待实现")
                .foregroundColor(.secondary)
        }
        .navigationTitle("发现")
    }
}

// 个人中心视图
struct ProfileView: View {
    @StateObject private var authManager = AuthManager.shared
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 用户信息卡片
                if let user = authManager.currentUser {
                    VStack(spacing: 10) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.accentColor)
                        
                        Text(user.username)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(user.email)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            Label(user.role.rawValue.capitalized, systemImage: "person.badge.shield.checkmark")
                            Spacer()
                            Label(user.subscriptionStatus?.rawValue.capitalized ?? "Free", systemImage: "star.circle")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                    .padding(.horizontal)
                }
                
                // 功能列表
                VStack(spacing: 0) {
                    // 我的订阅
                    NavigationLink {
                        Text("订阅管理（待实现）")
                    } label: {
                        HStack {
                            Label("我的订阅", systemImage: "star.circle")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                    }
                    
                    Divider()
                    
                    // 设置
                    NavigationLink {
                        Text("设置（待实现）")
                    } label: {
                        HStack {
                            Label("设置", systemImage: "gear")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                    }
                    
                    Divider()
                    
                    // 退出登录
                    Button {
                        authManager.logout()
                    } label: {
                        HStack {
                            Label("退出登录", systemImage: "arrow.right.square")
                                .foregroundColor(.red)
                            Spacer()
                        }
                        .padding()
                    }
                }
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                .padding(.horizontal)
                
                Spacer()
            }
            .padding(.top)
        }
        .navigationTitle("个人中心")
    }
}

#Preview {
    MainTabView()
}
