//
//  ContentListView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Content/ContentListView.swift
import SwiftUI
struct ContentListView: View {
    @StateObject private var contentService = ContentService()
    @State private var selectedContentType: Content.ContentType?
    @State private var selectedCategory: Content.ContentCategory?
    @State private var currentPage = 1
    @State private var isLoadingMore = false
    @State private var showUploadView = false
    // 定义网格布局的列
    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    var body: some View {
        NavigationStack {
            VStack {
                // 过滤器
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        FilterChip(
                            title: "全部",
                            isSelected: selectedContentType == nil
                        ) {
                            selectedContentType = nil
                            refreshContent()
                        }
                        
                        ForEach(Content.ContentType.allCases, id: \.self) { type in
                            FilterChip(
                                title: type.displayName,
                                isSelected: selectedContentType == type
                            ) {
                                selectedContentType = type
                                refreshContent()
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // 内容网格
                if contentService.isLoading && currentPage == 1 {
                    ProgressView()
                } else if contentService.contents.isEmpty {
                    EmptyStateView()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(contentService.contents) { content in
                                NavigationLink(value: content) {
                                    ContentGridCard(content: content)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                            
                            // 加载更多
                            if !contentService.isLoading {
                                Color.clear
                                    .frame(height: 1)
                                    .onAppear {
                                        loadMoreContent()
                                    }
                            }
                        }
                        .padding()
                        
                        if isLoadingMore {
                            ProgressView()
                                .padding()
                        }
                    }
                }
            }
            // 将此添加到ContentListView的顶部导航中
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showUploadView = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showUploadView) {
                ContentUploadView()
            }
            .navigationTitle("探索内容")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(for: Content.self) { content in
                ContentDetailView(content: content)
            }
        }
        .onAppear {
            if contentService.contents.isEmpty {
                refreshContent()
            }
        }
    }
    
    private func refreshContent() {
        currentPage = 1
        loadContent()
    }
    
    private func loadContent() {
        Task {
            await contentService.getContents(
                page: currentPage,
                contentType: selectedContentType?.rawValue,
                category: selectedCategory?.rawValue
            )
        }
    }
    
    private func loadMoreContent() {
        guard !isLoadingMore else { return }
        
        isLoadingMore = true
        currentPage += 1
        
        Task {
            await contentService.getContents(
                page: currentPage,
                contentType: selectedContentType?.rawValue,
                category: selectedCategory?.rawValue
            )
            isLoadingMore = false
        }
    }
}


// MARK: - Empty State
struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "film.stack")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("暂无内容")
                .font(.headline)
            
            Text("还没有内容，稍后再来看看吧")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

// MARK: - Content Extensions
extension Content.ContentType {
    var displayName: String {
        switch self {
        case .video180: return "180° 视频"
        case .photo180: return "180° 照片"
        case .video360: return "360° 视频"
        case .photo360: return "360° 照片"
        case .spatialVideo: return "空间视频"
        case .spatialPhoto: return "空间照片"
        }
    }
}

extension Content.ContentCategory {
    var displayName: String {
        switch self {
        case .travel: return "旅行"
        case .education: return "教育"
        case .entertainment: return "娱乐"
        case .sports: return "运动"
        case .news: return "新闻"
        case .documentary: return "纪录片"
        case .art: return "艺术"
        case .other: return "其他"
        }
    }
}
// MARK: - Content Grid Card (新的卡片样式适配网格布局)
struct ContentGridCard: View {
    let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // 缩略图
            if let thumbnailURL = content.files.thumbnail?.url {
                AsyncImage(url: URL(string: thumbnailURL)) { image in
                    image.resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                }
                .frame(height: 200)
                .cornerRadius(8)
                .clipped()
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 200)
                    .cornerRadius(8)
            }
            
            // 标题
            Text(content.localizedTitle)
                .font(.headline)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            
            // 创作者
            Text("by \(content.creatorId.username)")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(1)
            
            // 统计信息和价格
            HStack {
                HStack(spacing: 8) {
                    Label("\(content.stats.views)", systemImage: "eye")
                        .font(.caption)
                    
                    Label("\(content.stats.likes)", systemImage: "heart")
                        .font(.caption)
                }
                .foregroundColor(.secondary)
                
                Spacer()
                
                // 价格标签
                if content.pricing.isFree {
                    Text("免费")
                        .font(.caption)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.1))
                        .foregroundColor(.green)
                        .cornerRadius(4)
                } else {
                    Text(content.formattedPrice)
                        .font(.caption)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(4)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}



#Preview {
    ContentListView()
}
