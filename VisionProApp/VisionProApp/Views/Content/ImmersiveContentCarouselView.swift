//
//  ImmersiveContentCarouselView.swift
//  VisionProApp
//
//  Created on 2025/5/12.
//

import SwiftUI

struct ImmersiveContentCarouselView: View {
    @StateObject private var contentService = ContentService()
    @StateObject private var interactionService = InteractionService()
    @State private var contents: [Content] = []
    @State private var currentIndex = 0
    @State private var dragOffset: CGFloat = 0
    @State private var isDragging = false
    @State private var showComments = false
    @State private var commentText = ""
    
    // Card configuration
    private let cardWidth: CGFloat = 500 // 更宽的卡片
    private let cardSpacing: CGFloat = 20 // 增加间距
    private let sideCardScale: CGFloat = 0.8 // 更大的侧面卡片
    private let sideCardOffset: CGFloat = 40 // 更远的侧面偏移
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 背景 - 使用半透明背景代替黑色
                Color.black.opacity(0)
                    .ignoresSafeArea()
                
                if contents.isEmpty {
                    loadingView
                } else {
                    // 轮播内容
                    immersiveCarouselStack(in: geometry)
                    
                    // 评论侧边栏 (条件显示)
                    if showComments {
                        commentsSidebar
                            .frame(width: 350)
                            .transition(.move(edge: .trailing))
                            .zIndex(100)
                    }
                    
                    // 导航控制
                    VStack {
                 
                        
                        Spacer()
                        
                    }
                }
            }
        }
        .onAppear {
            loadContents()
        }
    }
    
    // MARK: - 子视图
    
    private var loadingView: some View {
        VStack {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.5)
            
            Text("加载内容中...")
                .font(.title2)
                .foregroundColor(.white)
                .padding(.top, 20)
        }
    }
    
    private func immersiveCarouselStack(in geometry: GeometryProxy) -> some View {
        HStack(spacing: cardSpacing) {
            ForEach(0..<contents.count, id: \.self) { index in
                ImmersiveContentCard(
                    content: contents[index],
                    onPlay: {
                        // 处理播放动作
                        print("播放内容: \(contents[index].localizedTitle)")
                    },
                    isLiked: interactionService.likedContents.contains(contents[index].id),
                    isFavorited: interactionService.favoritedContents.contains(contents[index].id),
                    onLike: {
                        toggleLike(content: contents[index])
                    },
                    onFavorite: {
                        toggleFavorite(content: contents[index])
                    },
                    onComment: {
                        withAnimation {
                            showComments.toggle()
                        }
                    }
                )
                .frame(width: cardWidth)
                .scaleEffect(contentCardScale(for: index))
                .offset(x: contentCardOffset(for: index))
                .zIndex(currentIndex == index ? 1 : 0)
            }
        }
        .frame(width: geometry.size.width, alignment: .leading)
        .offset(x: calculateHStackOffset(in: geometry))
        .gesture(
            DragGesture()
                .onChanged { value in
                    isDragging = true
                    dragOffset = value.translation.width
                }
                .onEnded { value in
                    isDragging = false
                    
                    // 确定是否应该移动到下一张/上一张卡片
                    let cardThreshold = cardWidth / 3
                    
                    if value.translation.width < -cardThreshold && currentIndex < contents.count - 1 {
                        // 向左滑动 - 移动到下一张卡片
                        withAnimation {
                            currentIndex += 1
                            dragOffset = 0
                        }
                    } else if value.translation.width > cardThreshold && currentIndex > 0 {
                        // 向右滑动 - 移动到上一张卡片
                        withAnimation {
                            currentIndex -= 1
                            dragOffset = 0
                        }
                    } else {
                        // 重置到当前卡片
                        withAnimation {
                            dragOffset = 0
                        }
                    }
                }
        )
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isDragging)
    }
    
    /* private var topInteractionBar: some View {
        HStack {
            // 左侧标题
            Text("发现精彩内容")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(.leading, 40)
            
            Spacer()
            
            // 右侧按钮
            HStack(spacing: 20) {
                Button(action: {
                    // 筛选
                }) {
                    Image(systemName: "line.horizontal.3.decrease.circle")
                        .font(.title2)
                        .foregroundColor(.white)
                }
                
                Button(action: {
                    // 搜索
                }) {
                    Image(systemName: "magnifyingglass")
                        .font(.title2)
                        .foregroundColor(.white)
                }
                
                Button(action: {
                    withAnimation {
                        showComments.toggle()
                    }
                }) {
                    Image(systemName: "bubble.left.fill")
                        .font(.title2)
                        .foregroundColor(.white)
                        .overlay(
                            showComments ?
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 12, height: 12)
                                .offset(x: 8, y: -8)
                            : nil
                        )
                }
            }
            .padding(.trailing, 30)
        }
        .padding(.vertical, 10)
        .background(Color.black.opacity(0.3))
    }
    
   private var navigationControls: some View {
        HStack {
           // 上一个按钮
            Button(action: {
                if currentIndex > 0 {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                        currentIndex -= 1
                    }
                }
            }) {
                Image(systemName: "chevron.left.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.white)
                    .opacity(currentIndex > 0 ? 1.0 : 0.3)
                    .shadow(color: .black.opacity(0.3), radius: 5)
            }
            .disabled(currentIndex <= 0)
            .padding(.leading, 40)
            
            Spacer()
            
           // 页面指示器
            HStack(spacing: 8) {
                ForEach(0..<min(contents.count, 7), id: \.self) { index in
                    Circle()
                        .fill(currentIndex == index ? Color.white : Color.white.opacity(0.3))
                        .frame(width: 8, height: 8)
                }
            }
            .padding(8)
            .background(Color.black.opacity(0.3))
            .cornerRadius(12)
            
            Spacer()
            
            // 下一个按钮
            Button(action: {
                if currentIndex < contents.count - 1 {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                        currentIndex += 1
                    }
                } else {
                    // 到达末尾时加载更多内容
                    loadMoreContents()
                }
            }) {
                Image(systemName: "chevron.right.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.white)
                    .opacity(currentIndex < contents.count - 1 ? 1.0 : 0.3)
                    .shadow(color: .black.opacity(0.3), radius: 5)
            }
            .disabled(currentIndex >= contents.count - 1)
            .padding(.trailing, 40)
        }
    }
     */
    private var commentsSidebar: some View {
        GeometryReader { geometry in
            ZStack(alignment: .topLeading) {
                // 背景
                Color.black.opacity(0.4)
                    .cornerRadius(16, corners: [.topLeft, .bottomLeft])
                
                VStack(spacing: 0) {
                    // 标题栏
                    HStack {
                        Text("评论")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Spacer()
                        
                        Button(action: {
                            withAnimation {
                                showComments = false
                            }
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.white.opacity(0.4))
                        }
                    }
                    .padding()
                    
                    Divider()
                        .background(Color.white.opacity(0.2))
                    
                    // 评论列表
                    if currentIndex < contents.count {
                        if let comments = interactionService.comments[contents[currentIndex].id], !comments.isEmpty {
                            ScrollView {
                                LazyVStack(alignment: .leading, spacing: 12) {
                                    ForEach(comments) { comment in
                                        CommentItemView(
                                            comment: comment,
                                            onReply: { /* 回复评论 */ },
                                            onLike: { /* 点赞评论 */ }
                                        )
                                        .padding(.horizontal)
                                    }
                                }
                                .padding(.vertical)
                            }
                        } else {
                            Spacer()
                            Text("暂无评论")
                                .foregroundColor(.gray)
                            Spacer()
                        }
                    }
                    
                    Divider()
                        .background(Color.white.opacity(0.2))
                    
                    // 评论输入框
                    HStack {
                        TextField("添加评论...", text: $commentText)
                            .padding(10)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(20)
                        
                        Button(action: {
                            sendComment()
                        }) {
                            Image(systemName: "paperplane.fill")
                                .foregroundColor(commentText.isEmpty ? .gray : .white)
                        }
                        .disabled(commentText.isEmpty)
                    }
                    .padding()
                }
            }
            .frame(maxHeight: .infinity)
            .position(x: geometry.size.width - -295, y: geometry.size.height / 2) // 右侧定位
        }
    }
    
    // MARK: - 辅助方法
    
    private func calculateHStackOffset(in geometry: GeometryProxy) -> CGFloat {
        let totalCardWidth = cardWidth + cardSpacing
        let centerPosition = (geometry.size.width - cardWidth) / 2
        let offset = centerPosition - CGFloat(currentIndex) * totalCardWidth
        return offset + dragOffset
    }
    
    private func contentCardScale(for index: Int) -> CGFloat {
        let distance = abs(CGFloat(index - currentIndex))
        
        // 应用拖动效果到缩放
        if isDragging {
            let dragDirection = dragOffset < 0 ? 1.0 : -1.0
            let dragMagnitude = min(abs(dragOffset) / cardWidth, 1.0)
            if index == currentIndex {
                // 当前卡片在拖动时变小
                return 1.0 - (1.0 - sideCardScale) * dragMagnitude
            } else if index == currentIndex + Int(dragDirection) {
                // 拖动方向的下一张/上一张卡片变大
                return sideCardScale + (1.0 - sideCardScale) * dragMagnitude
            }
        }
        
        // 正常缩放
        if distance == 0 {
            return 1.0 // 当前卡片
        } else if distance <= 1 {
            return sideCardScale // 相邻卡片
        } else {
            return 0.8 // 更远的卡片
        }
    }
    
    private func contentCardOffset(for index: Int) -> CGFloat {
        if isDragging {
            let dragDirection = dragOffset < 0 ? 1.0 : -1.0
            let dragMagnitude = min(abs(dragOffset) / cardWidth, 1.0)
            
            if index == currentIndex {
                // 当前卡片在拖动方向上稍微移动
                return dragDirection * sideCardOffset * dragMagnitude
            } else if index == currentIndex + Int(dragDirection) {
                // 拖动方向的下一张/上一张卡片向中心移动
                return (index < currentIndex ? sideCardOffset : -sideCardOffset) * (1.0 - dragMagnitude)
            }
        }
        
        if index < currentIndex {
            return -sideCardOffset
        } else if index > currentIndex {
            return sideCardOffset
        }
        return 0 // 当前卡片
    }
    
    // MARK: - 数据加载和交互
    
    private func loadContents() {
        Task {
            await contentService.getContents()
            
            // 获取所有内容的评论
            for content in contentService.contents {
                if interactionService.comments[content.id] == nil {
                    try? await interactionService.getComments(contentId: content.id)
                }
            }
            
            await MainActor.run {
                self.contents = contentService.contents
            }
        }
    }
    
    private func loadMoreContents() {
        Task {
            // 获取下一页
            let nextPage = (contents.count / 20) + 1
            await contentService.getContents(page: nextPage)
            
            // 获取新内容的评论
            for content in contentService.contents {
                if interactionService.comments[content.id] == nil {
                    try? await interactionService.getComments(contentId: content.id)
                }
            }
            
            await MainActor.run {
                contents.append(contentsOf: contentService.contents)
            }
        }
    }
    
    private func toggleLike(content: Content) {
        Task {
            try? await interactionService.toggleLike(contentId: content.id)
        }
    }
    
    private func toggleFavorite(content: Content) {
        Task {
            try? await interactionService.toggleFavorite(contentId: content.id)
        }
    }
    
    private func sendComment() {
        guard !commentText.isEmpty && currentIndex < contents.count else { return }
        
        Task {
            do {
                let _ = try await interactionService.addComment(
                    contentId: contents[currentIndex].id,
                    text: commentText
                )
                await MainActor.run {
                    commentText = ""
                }
            } catch {
                print("发送评论失败: \(error)")
            }
        }
    }
}

// MARK: - 沉浸式内容卡片

struct ImmersiveContentCard: View {
    let content: Content
    let onPlay: () -> Void
    let isLiked: Bool
    let isFavorited: Bool
    let onLike: () -> Void
    let onFavorite: () -> Void
    let onComment: () -> Void
    
    @State private var showDetails = false
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottom) {
                // 内容图片/预览
                if let thumbnailURL = content.thumbnailURL ?? content.files.thumbnail?.url,
                   let url = URL(string: thumbnailURL) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        case .failure(_):
                            defaultBackground
                        case .empty:
                            defaultBackground
                                .overlay(
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                )
                        @unknown default:
                            defaultBackground
                        }
                    }
                    .frame(height: geometry.size.height * 0.9)
                    .clipped()
                    .cornerRadius(25)
                } else {
                    defaultBackground
                        .frame(height: geometry.size.height * 0.9)
                        .cornerRadius(25)
                }
                
                // 中央播放按钮
                Button(action: onPlay) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 30))
                        .foregroundColor(.white)
                        .padding(30)
                        .background(Circle().fill(Color.black.opacity(0.4)))
                }
                .position(x: geometry.size.width / 2, y: geometry.size.height * 0.45)
                
                // 内容详情
                VStack(alignment: .leading, spacing: 8) {
                    // 标题栏
                    HStack {
                        // 标题
                        Text(content.localizedTitle)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        // 社交按钮组
                        HStack(spacing: 20) {
                            // 点赞按钮
                            Button(action: onLike) {
                                Image(systemName: isLiked ? "heart.fill" : "heart")
                                    .foregroundColor(isLiked ? .red : .white)
                                    .font(.title3)
                            }
                            
                            // 收藏按钮
                            Button(action: onFavorite) {
                                Image(systemName: isFavorited ? "star.fill" : "star")
                                    .foregroundColor(isFavorited ? .yellow : .white)
                                    .font(.title3)
                            }
                            
                            // 评论按钮
                            Button(action: onComment) {
                                Image(systemName: "bubble.left")
                                    .foregroundColor(.white)
                                    .font(.title3)
                            }
                            
                            // 分享按钮
                            Button(action: {}) {
                                Image(systemName: "square.and.arrow.up")
                                    .foregroundColor(.white)
                                    .font(.title3)
                            }
                        }
                    }
                    
                    // 创作者信息
                    HStack {
                        // 创作者头像
                        Circle()
                            .fill(Color(hex: "#6366F1"))
                            .frame(width: 30, height: 30)
                            .overlay(
                                Text(content.creatorId.username.prefix(1).uppercased())
                                    .font(.caption)
                                    .foregroundColor(.white)
                            )
                        
                        // 创作者名称和内容类型
                        VStack(alignment: .leading, spacing: 2) {
                            Text(content.creatorId.username)
                                .font(.subheadline)
                                .foregroundColor(.white)
                            
                            HStack {
                                Text(contentTypeDisplayName(content.contentType))
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.8))
                                
                                if content.pricing.isFree {
                                    Text("免费")
                                        .font(.caption)
                                        .foregroundColor(.green)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Capsule().fill(Color.green.opacity(0.3)))
                                } else {
                                    Text(content.formattedPrice)
                                        .font(.caption)
                                        .foregroundColor(.orange)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Capsule().fill(Color.orange.opacity(0.3)))
                                }
                            }
                        }
                        
                        Spacer()
                        
                        // 统计信息
                        HStack(spacing: 15) {
                            Label("\(content.stats.views)", systemImage: "eye")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                            
                            Label("\(content.stats.likes)", systemImage: "heart")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                            
                            Label("\(content.stats.comments)", systemImage: "bubble.left")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                        }
                    }
                    
                    // 点击展开的详细描述
                    if showDetails, let description = content.description?["zh-CN"] {
                        Text(description)
                            .font(.body)
                            .foregroundColor(.white.opacity(0.9))
                            .padding(.top, 8)
                            .lineLimit(3)
                            .transition(.opacity.combined(with: .move(edge: .top)))
                            .animation(.easeInOut, value: showDetails)
                    }
                }
                .padding(20)
                .background(
                    // 使用渐变让底部信息条更加美观
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color.clear,
                            Color.black.opacity(0.3),
                            Color.black.opacity(0.7)
                        ]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .cornerRadius(25, corners: [.bottomLeft, .bottomRight])
            }
            .cornerRadius(25)
            .shadow(color: .black.opacity(0.3), radius: 15)
            .onTapGesture {
                withAnimation {
                    showDetails.toggle()
                }
            }
        }
    }
    
    private var defaultBackground: some View {
        LinearGradient(
            colors: [
                Color(hex: "#6366F1"),
                Color(hex: "#8B5CF6"),
                Color(hex: "#EC4899")
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    private func contentTypeDisplayName(_ type: Content.ContentType) -> String {
        switch type {
        case .video180: return "180° 视频"
        case .photo180: return "180° 照片"
        case .video360: return "360° 视频"
        case .photo360: return "360° 照片"
        case .spatialVideo: return "空间视频"
        case .spatialPhoto: return "空间照片"
        }
    }
}

// MARK: - 辅助扩展

// 本项目其他文件中已经定义了这些扩展，因此这里不再重复定义
// 但为了参考，保留注释说明

/*
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
*/

// MARK: - 预览

#Preview {
    ImmersiveContentCarouselView()
        .preferredColorScheme(.dark)
}
