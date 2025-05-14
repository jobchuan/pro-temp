//
//  OfflineContentView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Content/OfflineContentView.swift
import SwiftUI

struct OfflineContentView: View {
    @StateObject private var interactionService = InteractionService()
    @State private var selectedStatus: OfflineStatus? = nil
    @State private var showingStorageInfo = false
    
    var body: some View {
        NavigationStack {
            VStack {
                // 存储信息
                if showingStorageInfo {
                    StorageInfoView()
                        .padding()
                }
                
                // 状态过滤器
                ScrollView(.horizontal) {
                    HStack {
                        FilterChip(title: "全部", isSelected: selectedStatus == nil) {
                            selectedStatus = nil
                        }
                        
                        ForEach([OfflineStatus.downloading, .completed, .failed], id: \.self) { status in
                            FilterChip(
                                title: statusTitle(for: status),
                                isSelected: selectedStatus == status
                            ) {
                                selectedStatus = status
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // 内容列表
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(filteredContent) { content in
                            OfflineContentItem(content: content)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("离线内容")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingStorageInfo.toggle()
                    }) {
                        Image(systemName: "info.circle")
                    }
                }
            }
        }
        .onAppear {
            loadOfflineContent()
        }
    }
    
    private var filteredContent: [OfflineContent] {
        if let status = selectedStatus {
            return interactionService.offlineContents.filter { $0.status == status }
        }
        return interactionService.offlineContents
    }
    
    private func statusTitle(for status: OfflineStatus) -> String {
        switch status {
        case .pending: return "等待中"
        case .downloading: return "下载中"
        case .completed: return "已完成"
        case .failed: return "失败"
        case .expired: return "已过期"
        }
    }
    
    private func loadOfflineContent() {
        Task {
            try? await interactionService.getOfflineContent()
        }
    }
}

// MARK: - Offline Content Item
struct OfflineContentItem: View {
    let content: OfflineContent
    @State private var showingOptions = false
    
    var body: some View {
        HStack(spacing: 16) {
            // 缩略图
            if let thumbnailURL = content.metadata.thumbnailURL {
                AsyncImage(url: URL(string: thumbnailURL)) { image in
                    image.resizable()
                } placeholder: {
                    Rectangle().fill(Color.gray.opacity(0.3))
                }
                .frame(width: 120, height: 80)
                .cornerRadius(8)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                // 标题
                Text(content.metadata.title["zh-CN"] ?? "")
                    .font(.headline)
                    .lineLimit(2)
                
                // 状态和进度
                HStack {
                    StatusBadge(status: content.status)
                    
                    if content.status == .downloading {
                        ProgressView(value: content.progress / 100)
                            .frame(width: 100)
                    }
                    
                    Spacer()
                    
                    // 文件大小
                    Text(formatFileSize(content.totalSize))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // 过期时间
                if content.status == .completed {
                    Text("过期时间: \(content.expiresAt.formatted())")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // 操作按钮
            Menu {
                if content.status == .completed {
                    Button(action: playOffline) {
                        Label("播放", systemImage: "play.circle")
                    }
                    
                    Button(action: deleteContent) {
                        Label("删除", systemImage: "trash")
                    }
                } else if content.status == .failed {
                    Button(action: retryDownload) {
                        Label("重试", systemImage: "arrow.clockwise")
                    }
                } else if content.status == .downloading {
                    Button(action: pauseDownload) {
                        Label("暂停", systemImage: "pause.circle")
                    }
                }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.title2)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func formatFileSize(_ size: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }
    
    private func playOffline() {
        // TODO: 实现离线播放
    }
    
    private func deleteContent() {
        // TODO: 实现删除
    }
    
    private func retryDownload() {
        // TODO: 实现重试下载
    }
    
    private func pauseDownload() {
        // TODO: 实现暂停下载
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: OfflineStatus
    
    var body: some View {
        Text(statusText)
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(textColor)
            .cornerRadius(4)
    }
    
    private var statusText: String {
        switch status {
        case .pending: return "等待中"
        case .downloading: return "下载中"
        case .completed: return "已完成"
        case .failed: return "失败"
        case .expired: return "已过期"
        }
    }
    
    private var backgroundColor: Color {
        switch status {
        case .pending: return Color.orange.opacity(0.1)
        case .downloading: return Color.blue.opacity(0.1)
        case .completed: return Color.green.opacity(0.1)
        case .failed: return Color.red.opacity(0.1)
        case .expired: return Color.gray.opacity(0.1)
        }
    }
    
    private var textColor: Color {
        switch status {
        case .pending: return .orange
        case .downloading: return .blue
        case .completed: return .green
        case .failed: return .red
        case .expired: return .gray
        }
    }
}

// MARK: - Storage Info View
struct StorageInfoView: View {
    @State private var totalStorage: Int64 = 0
    @State private var usedStorage: Int64 = 0
    @State private var availableStorage: Int64 = 0
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("存储空间")
                .font(.headline)
            
            // 进度条
            ProgressView(value: Double(usedStorage) / Double(totalStorage))
            
            // 详细信息
            HStack {
                VStack(alignment: .leading) {
                    Text("已使用")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatFileSize(usedStorage))
                        .font(.subheadline)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("可用")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatFileSize(availableStorage))
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .onAppear {
            calculateStorage()
        }
    }
    
    private func formatFileSize(_ size: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }
    
    private func calculateStorage() {
        // TODO: 实现存储计算
        totalStorage = 128 * 1024 * 1024 * 1024 // 128GB
        usedStorage = 32 * 1024 * 1024 * 1024   // 32GB
        availableStorage = totalStorage - usedStorage
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(isSelected ? Color.blue : Color(.systemGray5))
                )
                .foregroundColor(isSelected ? .white : .primary)
        }
    }
}
