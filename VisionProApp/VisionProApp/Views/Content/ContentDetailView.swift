//
//  ContentDetailView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//

import SwiftUI

struct ContentDetailView: View {
    let content: Content
    @StateObject private var viewModel: ContentDetailViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showingComments = false
    @State private var showingMoreOptions = false
    
    init(content: Content) {
        self.content = content
        self._viewModel = StateObject(wrappedValue: ContentDetailViewModel(contentId: content.id))
    }
    
    var body: some View {
        ZStack {
            // 背景海报图
            backgroundPoster
            
            // 底部渐变遮罩
            LinearGradient(
                stops: [
                    Gradient.Stop(color: .clear, location: 0),
                    Gradient.Stop(color: .black.opacity(0.3), location: 0.7),
                    Gradient.Stop(color: .black.opacity(0.9), location: 1.0)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            // 主要内容
            VStack {
                // 顶部导航
                topNavigation
                
                Spacer()
                
                // 中央播放提示
                centralPlayButton
                
                Spacer()
                
                // 底部内容区域
                bottomContentSection
            }
            
            // 悬浮元素
            VStack {
                Spacer()
                
                HStack {
                    Spacer()
                    
                    // 悬浮评论按钮
                    floatingCommentButton
                        .padding(.trailing, 20)
                }
                .padding(.bottom, 300)
            }
            
            // 评论侧边栏
            if showingComments {
                CommentsSidePanel(
                    contentId: content.id,
                    viewModel: viewModel,
                    isShowing: $showingComments
                )
                .transition(.move(edge: .trailing))
                .zIndex(2)
            }
            
            // 更多选项菜单
            if showingMoreOptions {
                MoreOptionsMenu(
                    content: content,
                    viewModel: viewModel,
                    isShowing: $showingMoreOptions
                )
                .transition(.opacity)
                .zIndex(3)
            }
        }
        .navigationBarHidden(true)
        .ignoresSafeArea()
        .onAppear {
            Task {
                await viewModel.loadInteractionData()
            }
        }
    }
    
    // MARK: - Components
    
    private var backgroundPoster: some View {
        GeometryReader { geometry in
            if let thumbnailURL = content.thumbnailURL ?? content.files.thumbnail?.url,
               let url = URL(string: thumbnailURL) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .clipped()
                    case .failure(_):
                        defaultPosterBackground
                    case .empty:
                        defaultPosterBackground
                            .overlay(
                                ProgressView()
                                    .scaleEffect(1.5)
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            )
                    @unknown default:
                        defaultPosterBackground
                    }
                }
            } else {
                defaultPosterBackground
            }
        }
        .ignoresSafeArea()
    }
    
    private var defaultPosterBackground: some View {
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
    
    private var topNavigation: some View {
        HStack {
            // 返回按钮
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 48, height: 48)
            }
            
            Spacer()
            
            // 更多选项按钮
            Button {
                showingMoreOptions = true
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 48, height: 48)
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 8)
    }
    
    private var centralPlayButton: some View {
        Button {
            viewModel.playContent(content)
        } label: {
            ZStack {
                Circle()
                    .fill(Color.black.opacity(0.5))
                    .frame(width: 120, height: 120)
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.3), lineWidth: 2)
                    )
                
                Image(systemName: "play.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.white)
                    .offset(x: 4) // 视觉平衡调整
            }
        }
        .opacity(0.8)
    }
    
    private var bottomContentSection: some View {
        VStack(spacing: 0) {
            // 半透明背景
            Rectangle()
                .fill(Color.black.opacity(0.35)) // 增加不透明度以提高对比度
                .frame(height: 280)
                .overlay(
                    HStack(alignment: .top, spacing: 40) {
                        // 左侧：内容信息
                        contentInfoSection
                        
                        Spacer()
                        
                        // 右侧：操作按钮
                        actionButtonsSection
                    }
                    .padding([.horizontal], 40)
                    .padding([.top], 40)
                )
        }
    }
    
    private var contentInfoSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            // 标题
            Text(content.localizedTitle)
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)
            
            // 创作者信息和标签
            HStack(spacing: 12) {
                // 创作者头像
                Circle()
                    .fill(Color.purple)
                    .frame(width: 50, height: 50) // 增大头像尺寸
                    .overlay(
                        Text(content.creatorId.username.prefix(1).uppercased())
                            .font(.system(size: 22, weight: .bold)) // 增大字体
                            .foregroundColor(.white)
                    )
                
                // 创作者名称和时间
                Text("\(content.creatorId.username) · \(formatDate(content.createdAt))")
                    .font(.system(size: 18))
                    .foregroundColor(.white)
                
                Spacer()
                
                // 内容类型标签
                HStack(spacing: 8) {
                    ContentTypeTag(contentType: content.contentType)
                    PriceTag(pricing: content.pricing)
                }
            }
            
            // 描述
            if !content.localizedDescription.isEmpty {
                Text(content.localizedDescription)
                    .font(.system(size: 16))
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(2)
            }
            
            // 统计信息
            HStack(spacing: 20) {
                StatItem(value: content.stats.views, label: "观看")
                StatItem(value: content.stats.likes, label: "喜欢")
                StatItem(value: content.stats.comments, label: "评论")
                StatItem(value: content.stats.shares, label: "分享")
            }
        }
    }
    
    private var actionButtonsSection: some View {
        VStack(spacing: 20) {
            // 下载按钮（原播放按钮）
            Button {
                Task {
                    do {
                        let interactionService = InteractionService()
                        try await interactionService.createOfflineDownload(contentId: content.id)
                        print("开始下载内容")
                    } catch {
                        print("下载失败: \(error)")
                    }
                }
            } label: {
                HStack {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.system(size: 20))
                    Text("下载")
                        .font(.system(size: 20, weight: .bold))
                }
                .foregroundColor(.white)
                .frame(width: 200, height: 56)
                .background(
                    Capsule()
                        .fill(Color.blue)
                )
            }
            
            // 图标操作按钮组
            HStack(spacing: 16) {
                // 点赞按钮
                CircleActionButton(
                    icon: "heart.fill",
                    color: viewModel.isLiked ? .red : .white,
                    isActive: viewModel.isLiked
                ) {
                    Task {
                        await viewModel.toggleLike(content)
                    }
                }
                
                // 收藏按钮
                CircleActionButton(
                    icon: "star.fill",
                    color: viewModel.isFavorited ? .yellow : .white,
                    isActive: viewModel.isFavorited
                ) {
                    Task {
                        await viewModel.toggleFavorite(content)
                    }
                }
                
                // 评论按钮
                CircleActionButton(
                    icon: "bubble.left.fill",
                    color: .white
                ) {
                    withAnimation {
                        showingComments.toggle()
                    }
                }
                
                // 分享按钮
                CircleActionButton(
                    icon: "arrow.up.right",
                    color: .white
                ) {
                    viewModel.shareContent(content)
                }
            }
        }
    }
    
    private var floatingCommentButton: some View {
        Button {
            withAnimation {
                showingComments.toggle()
            }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: "bubble.left.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
                
                Text("\(content.stats.comments)")
                    .font(.system(size: 12))
                    .foregroundColor(.white)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func formatDate(_ date: Date?) -> String {
        guard let date = date else { return "" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        formatter.locale = Locale(identifier: "zh_CN")
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Supporting Views

struct CircleActionButton: View {
    let icon: String
    let color: Color
    var isActive: Bool = false
    let action: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button {
            action()
        } label: {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .medium))
                .foregroundColor(color)
                .frame(width: 56, height: 56)
                .background(
                    Circle()
                        .fill(Color.white.opacity(isPressed ? 0.2 : 0.1))
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        )
                )
                .scaleEffect(isPressed ? 0.9 : 1.0)
        }
        .scaleEffect(isActive ? 1.1 : 1.0)
        .animation(.easeInOut(duration: 0.2), value: isActive)
        .onTapGesture { }
        .onLongPressGesture(
            pressing: { isPressing in
                withAnimation(.easeInOut(duration: 0.1)) {
                    isPressed = isPressing
                }
            },
            perform: {
                action()
            }
        )
    }
}

// MARK: - Comment Input View

struct CommentInputView: View {
    @State private var commentText = ""
    @ObservedObject var viewModel: ContentDetailViewModel
    let onSubmit: (String) -> Void
    
    var body: some View {
        VStack(spacing: 8) {
            // 回复提示
            if let replyingTo = viewModel.replyingTo {
                HStack {
                    Text("回复 @\(replyingTo.user?.username ?? "")")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                    
                    Spacer()
                    
                    Button("取消") {
                        viewModel.cancelReply()
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
                .padding([.horizontal], 12)
            }
            
            // 输入框
            HStack {
                TextField(
                    viewModel.replyingTo != nil ? "回复评论..." : "添加评论...",
                    text: $commentText,
                    axis: .vertical
                )
                .textFieldStyle(.roundedBorder)
                .lineLimit(1...3)
                .background(Color.white)
                .cornerRadius(8)
                
                Button {
                    if !commentText.isEmpty {
                        onSubmit(commentText)
                        commentText = ""
                    }
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background {
                            Circle()
                                .fill(commentText.isEmpty ? Color.gray : Color.blue)
                        }
                }
                .disabled(commentText.isEmpty)
            }
        }
    }
}

// MARK: - Comment Side Panel

struct CommentsSidePanel: View {
    let contentId: String
    @ObservedObject var viewModel: ContentDetailViewModel
    @Binding var isShowing: Bool
    
    var body: some View {
        HStack {
            Spacer()
            
            VStack(spacing: 0) {
                // 标题栏
                HStack {
                    Text("评论")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Button {
                        withAnimation {
                            isShowing = false
                        }
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                    }
                }
                .padding([.horizontal], 20)
                .padding([.vertical], 20)
                
                // 评论输入框
                CommentInputView(viewModel: viewModel) { text in
                    Task {
                        await viewModel.sendComment(text: text)
                    }
                }
                .padding([.horizontal], 20)
                
                // 评论列表
                ScrollView {
                    LazyVStack(spacing: 16) {
                        if viewModel.isLoadingComments {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .padding()
                        } else if viewModel.comments.isEmpty {
                            EmptyCommentsView()
                        } else {
                            ForEach(viewModel.comments) { comment in
                                CommentItemView(
                                    comment: comment,
                                    onReply: {
                                        viewModel.startReply(to: comment)
                                    },
                                    onLike: {
                                        Task {
                                            await viewModel.likeComment(comment)
                                        }
                                    }
                                )
                                .padding([.horizontal], 20)
                            }
                        }
                    }
                    .padding([.top], 20)
                }
            }
            .frame(width: 400)
            .background(
                Color.black.opacity(0.9)
                    .overlay(
                        Rectangle()
                            .fill(Color.white.opacity(0.1))
                            .frame(width: 1)
                            .frame(maxHeight: .infinity),
                        alignment: .leading
                    )
            )
        }
    }
}

struct EmptyCommentsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "bubble.left")
                .font(.system(size: 48))
                .foregroundColor(.white.opacity(0.3))
            
            Text("暂无评论")
                .font(.system(size: 16))
                .foregroundColor(.white.opacity(0.5))
            
            Text("成为第一个评论的人")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.3))
        }
        .frame(maxWidth: .infinity)
        .padding([.vertical], 60)
    }
}

// MARK: - More Options Menu

struct MoreOptionsMenu: View {
    let content: Content
    @ObservedObject var viewModel: ContentDetailViewModel
    @Binding var isShowing: Bool
    
    var body: some View {
        ZStack {
            // 背景遮罩
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation {
                        isShowing = false
                    }
                }
            
            // 选项菜单
            VStack(spacing: 0) {
                OptionButton(title: "下载", icon: "arrow.down.circle") {
                    // TODO: 实现下载功能
                    withAnimation {
                        isShowing = false
                    }
                }
                
                OptionButton(title: "分享", icon: "square.and.arrow.up") {
                    viewModel.shareContent(content)
                    withAnimation {
                        isShowing = false
                    }
                }
                
                OptionButton(title: "举报", icon: "exclamationmark.triangle") {
                    viewModel.reportContent(content)
                    withAnimation {
                        isShowing = false
                    }
                }
                
                Divider()
                    .background(Color.white.opacity(0.2))
                
                OptionButton(title: "取消", icon: nil) {
                    withAnimation {
                        isShowing = false
                    }
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.black.opacity(0.8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.2), lineWidth: 1)
                    )
            )
            .frame(width: 300)
            .padding()
        }
    }
}

struct OptionButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                        .frame(width: 24)
                }
                
                Text(title)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                
                Spacer()
            }
            .padding([.horizontal], 20)
            .padding([.vertical], 16)
        }
    }
}

struct ContentTypeTag: View {
    let contentType: Content.ContentType
    
    var body: some View {
        Text(contentTypeDisplayName)
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(.white)
            .padding([.horizontal], 12)
            .padding([.vertical], 6)
            .background(
                Capsule()
                    .fill(Color.blue.opacity(0.8))
            )
    }
    
    private var contentTypeDisplayName: String {
        switch contentType {
        case .video180: return "180° 视频"
        case .photo180: return "180° 照片"
        case .video360: return "360° 视频"
        case .photo360: return "360° 照片"
        case .spatialVideo: return "空间视频"
        case .spatialPhoto: return "空间照片"
        }
    }
}

struct PriceTag: View {
    let pricing: Pricing
    
    var body: some View {
        Text(pricing.isFree ? "免费" : formattedPrice)
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(.white)
            .padding([.horizontal], 12)
            .padding([.vertical], 6)
            .background(
                Capsule()
                    .fill(pricing.isFree ? Color.green.opacity(0.8) : Color.orange.opacity(0.8))
            )
    }
    
    private var formattedPrice: String {
        let price = pricing.price ?? 0
        let currency = pricing.currency ?? "CNY"
        return "\(currency) \(String(format: "%.2f", price))"
    }
}

struct StatItem: View {
    let value: Int
    let label: String
    
    var body: some View {
        Text("\(value) \(label)")
            .font(.system(size: 14))
            .foregroundColor(Color.white.opacity(0.7))
    }
}

// MARK: - Preview

#Preview {
    let sampleCreator = Creator(
        id: "123",
        username: "测试用户",
        email: nil,
        profile: nil
    )
    
    let sampleContent = Content(
        id: "1",
        title: ["zh-CN": "示例内容"],
        description: ["zh-CN": "这是一个示例内容的描述"],
        contentType: .video360,
        files: ContentFiles(
            main: MainFile(
                url: "https://example.com/video.mp4",
                size: nil,
                duration: nil,
                resolution: nil
            ),
            thumbnail: FileInfo(
                url: "https://picsum.photos/1600/900",
                size: nil
            ),
            preview: nil
        ),
        media: nil,
        location: nil,
        creatorId: sampleCreator,
        tags: ["娱乐", "360°", "测试"],
        category: .entertainment,
        pricing: Pricing(isFree: true, price: nil, currency: nil),
        stats: ContentStats(views: 1234, likes: 56, favorites: 12, comments: 8, shares: 4, downloads: 0, danmakus: 0),
        status: .published,
        thumbnailURL: "https://picsum.photos/1600/900",
        createdAt: Date(),
        updatedAt: Date()
    )
    
    NavigationStack {
        ContentDetailView(content: sampleContent)
    }
}
