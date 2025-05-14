//
//  EnhancedVideoPlayer.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Player/EnhancedVideoPlayer.swift
import SwiftUI
import AVKit
import RealityKit

struct EnhancedVideoPlayer: View {
    let content: Content
    @StateObject private var playerViewModel = VideoPlayerViewModel()
    @StateObject private var interactionService = InteractionService()
    @State private var showControls = true
    @State private var showComments = false
    @State private var showDanmaku = true
    @State private var isPiPActive = false
    @State private var danmakuOpacity = 0.8
    @State private var spatialCommentMode = false
    
    // 手势控制状态
    @GestureState private var dragOffset = CGSize.zero
    @State private var currentBrightness: Double = 0.5 // visionOS中需要使用不同的亮度API
    @State private var currentVolume: Float = 0.5
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 视频播放器
                VideoPlayer(player: playerViewModel.player)
                    .overlay(
                        // 弹幕层
                        DanmakuView(
                            contentId: content.id,
                            currentTime: playerViewModel.currentTime,
                            isShowing: showDanmaku,
                            opacity: danmakuOpacity
                        )
                    )
                    .overlay(
                        // 控制层
                        VideoControlsView(
                            playerViewModel: playerViewModel,
                            content: content,
                            interactionService: interactionService,
                            showControls: $showControls,
                            showComments: $showComments,
                            showDanmaku: $showDanmaku,
                            isPiPActive: $isPiPActive,
                            danmakuOpacity: $danmakuOpacity
                        )
                        .opacity(showControls ? 1 : 0)
                        .animation(.easeInOut, value: showControls)
                    )
                    .gesture(
                        // 添加手势控制
                        DragGesture()
                            .updating($dragOffset) { value, state, _ in
                                state = value.translation
                            }
                            .onEnded { value in
                                handleGesture(value: value, in: geometry.size)
                            }
                    )
                    .onTapGesture {
                        showControls.toggle()
                    }
                
                // 评论层
                if showComments {
                    CommentsOverlay(
                        contentId: content.id,
                        interactionService: interactionService,
                        spatialMode: $spatialCommentMode
                    )
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing),
                        removal: .move(edge: .trailing)
                    ))
                }
                
                // 空间评论锚点
                if spatialCommentMode {
                    SpatialCommentAnchors(
                        contentId: content.id,
                        currentTime: playerViewModel.currentTime
                    )
                }
            }
        }
        .onAppear {
            Task {
                await setupPlayer()
            }
        }
        .onDisappear {
            saveProgress()
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)) { _ in
            if isPiPActive {
                playerViewModel.player.play()
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func setupPlayer() async {
        // 设置播放器
        playerViewModel.setupPlayer(with: content.files.main.url)
        
        do {
            // 获取交互状态
            let _ = try await interactionService.getInteractionStatus(contentId: content.id)
            
            // 获取观看历史
            if let history = try? await ViewHistory.getHistory(for: content.id) {
                playerViewModel.seek(to: history.progress)
            }
            
            // 加载弹幕
            _ = try? await interactionService.getDanmakuList(contentId: content.id)
            
            // 开始周期性保存进度
            startProgressTracking()
        } catch {
            print("设置播放器失败: \(error)")
        }
    }
    
    private func handleGesture(value: DragGesture.Value, in size: CGSize) {
        let horizontalMovement = value.translation.width
        let verticalMovement = value.translation.height
        let location = value.startLocation
        
        // 判断手势区域和方向
        if abs(horizontalMovement) > abs(verticalMovement) {
            // 水平滑动 - 快进/快退
            let progress = horizontalMovement / size.width
            let timeChange = progress * 30 // 最多30秒
            playerViewModel.seek(by: timeChange)
        } else {
            // 垂直滑动
            if location.x < size.width / 2 {
                // 左侧 - 调节亮度
                let brightness = currentBrightness - Double(verticalMovement / size.height)
                currentBrightness = max(0, min(1, brightness))
                // 在visionOS中需要使用不同的API来调节亮度
            } else {
                // 右侧 - 调节音量
                let volume = currentVolume - Float(verticalMovement / size.height)
                playerViewModel.setVolume(max(0, min(1, volume)))
            }
        }
    }
    
    private func saveProgress() {
        Task {
            try? await interactionService.recordViewHistory(
                contentId: content.id,
                progress: playerViewModel.currentTime,
                duration: playerViewModel.duration
            )
        }
    }
    
    private func startProgressTracking() {
        Timer.scheduledTimer(withTimeInterval: 10, repeats: true) { _ in
            saveProgress()
        }
    }
}

// MARK: - Video Controls View
struct VideoControlsView: View {
    @ObservedObject var playerViewModel: VideoPlayerViewModel
    let content: Content
    @ObservedObject var interactionService: InteractionService
    @Binding var showControls: Bool
    @Binding var showComments: Bool
    @Binding var showDanmaku: Bool
    @Binding var isPiPActive: Bool
    @Binding var danmakuOpacity: Double
    
    var body: some View {
        VStack {
            // 顶部控制栏
            HStack {
                Button(action: { /* 返回 */ }) {
                    Image(systemName: "chevron.left")
                        .font(.title2)
                }
                
                Spacer()
                
                // 弹幕控制
                Button(action: {
                    showDanmaku.toggle()
                }) {
                    Image(systemName: showDanmaku ? "text.bubble.fill" : "text.bubble")
                }
                
                // 画中画
                Button(action: {
                    isPiPActive.toggle()
                    if isPiPActive {
                        playerViewModel.startPictureInPicture()
                    } else {
                        playerViewModel.stopPictureInPicture()
                    }
                }) {
                    Image(systemName: "pip.enter")
                }
                
                // 更多选项
                Menu {
                    // 弹幕透明度
                    Slider(value: $danmakuOpacity, in: 0...1) {
                        Text("弹幕透明度")
                    }
                    
                    // 下载
                    Button(action: downloadContent) {
                        Label("下载", systemImage: "arrow.down.circle")
                    }
                    
                    // 分享
                    Button(action: shareContent) {
                        Label("分享", systemImage: "square.and.arrow.up")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                }
            }
            .padding()
            
            Spacer()
            
            // 底部控制栏
            VStack(spacing: 20) {
                // 进度条
                VideoProgressBar(
                    currentTime: playerViewModel.currentTime,
                    duration: playerViewModel.duration,
                    onSeek: { time in
                        playerViewModel.seek(to: time)
                    }
                )
                
                // 播放控制
                HStack(spacing: 30) {
                    // 播放/暂停
                    Button(action: {
                        playerViewModel.togglePlayPause()
                    }) {
                        Image(systemName: playerViewModel.isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 48))
                    }
                    
                    // 快进/快退
                    Button(action: {
                        playerViewModel.seek(by: -10)
                    }) {
                        Image(systemName: "gobackward.10")
                            .font(.title)
                    }
                    
                    Button(action: {
                        playerViewModel.seek(by: 10)
                    }) {
                        Image(systemName: "goforward.10")
                            .font(.title)
                    }
                    
                    Spacer()
                    
                    // 互动按钮
                    Button(action: toggleLike) {
                        Image(systemName: interactionService.likedContents.contains(content.id) ? "heart.fill" : "heart")
                            .foregroundColor(interactionService.likedContents.contains(content.id) ? .red : .white)
                    }
                    
                    Button(action: toggleFavorite) {
                        Image(systemName: interactionService.favoritedContents.contains(content.id) ? "star.fill" : "star")
                            .foregroundColor(interactionService.favoritedContents.contains(content.id) ? .yellow : .white)
                    }
                    
                    Button(action: {
                        showComments.toggle()
                    }) {
                        Image(systemName: "bubble.left")
                    }
                }
                .padding(.horizontal)
            }
            .padding()
        }
        .foregroundColor(.white)
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.7), Color.clear, Color.black.opacity(0.7)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
    
    private func toggleLike() {
        Task {
            try? await interactionService.toggleLike(contentId: content.id)
        }
    }
    
    private func toggleFavorite() {
        Task {
            try? await interactionService.toggleFavorite(contentId: content.id)
        }
    }
    
    private func downloadContent() {
        Task {
            try? await interactionService.createOfflineDownload(contentId: content.id)
        }
    }
    
    private func shareContent() {
        // 实现分享功能
    }
}

// MARK: - Progress Bar
struct VideoProgressBar: View {
    let currentTime: TimeInterval
    let duration: TimeInterval
    let onSeek: (TimeInterval) -> Void
    
    @State private var isDragging = false
    @State private var dragValue: TimeInterval = 0
    
    var progress: Double {
        guard duration > 0 else { return 0 }
        return (isDragging ? dragValue : currentTime) / duration
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // 背景
                Rectangle()
                    .fill(Color.white.opacity(0.3))
                    .frame(height: 4)
                
                // 进度
                Rectangle()
                    .fill(Color.white)
                    .frame(width: geometry.size.width * CGFloat(progress), height: 4)
                
                // 拖动手柄
                Circle()
                    .fill(Color.white)
                    .frame(width: 12, height: 12)
                    .offset(x: geometry.size.width * CGFloat(progress) - 6)
            }
            .gesture(
                DragGesture()
                    .onChanged { value in
                        isDragging = true
                        let progress = value.location.x / geometry.size.width
                        dragValue = duration * Double(max(0, min(1, progress)))
                    }
                    .onEnded { _ in
                        isDragging = false
                        onSeek(dragValue)
                    }
            )
        }
        .frame(height: 12)
    }
}

// MARK: - Danmaku View
struct DanmakuView: View {
    let contentId: String
    let currentTime: TimeInterval
    let isShowing: Bool
    let opacity: Double
    
    @StateObject private var danmakuManager = DanmakuManager()
    
    var body: some View {
        GeometryReader { geometry in
            if isShowing {
                ForEach(danmakuManager.visibleDanmakus) { danmaku in
                    DanmakuItemView(danmaku: danmaku, containerSize: geometry.size)
                        .opacity(opacity)
                }
            }
        }
        .onAppear {
            danmakuManager.startForContent(contentId)
        }
        .onChange(of: currentTime) { oldValue, newTime in
            danmakuManager.updateTime(newTime)
        }
    }
}

// MARK: - Danmaku Item View
struct DanmakuItemView: View {
    let danmaku: Danmaku
    let containerSize: CGSize
    @State private var offset: CGFloat = 0
    
    var body: some View {
        Text(danmaku.text)
            .font(.system(size: fontSize))
            .foregroundColor(Color(hex: danmaku.style?.color ?? "#FFFFFF"))
            .shadow(color: .black, radius: 1, x: 1, y: 1)
            .position(position)
            .onAppear {
                if danmaku.type == .scroll {
                    startScrollAnimation()
                }
            }
    }
    
    private var fontSize: CGFloat {
        switch danmaku.style?.fontSize {
        case .small: return 14
        case .large: return 22
        default: return 18
        }
    }
    
    private var position: CGPoint {
        switch danmaku.type {
        case .scroll:
            return CGPoint(
                x: containerSize.width + 100 - offset,
                y: CGFloat(danmaku.track) * 30 + 50
            )
        case .top:
            return CGPoint(
                x: containerSize.width / 2,
                y: CGFloat(danmaku.track) * 30 + 50
            )
        case .bottom:
            return CGPoint(
                x: containerSize.width / 2,
                y: containerSize.height - CGFloat(danmaku.track) * 30 - 50
            )
        case .spatial:
            // TODO: 实现空间定位
            return CGPoint(x: containerSize.width / 2, y: containerSize.height / 2)
        }
    }
    
    private func startScrollAnimation() {
        withAnimation(.linear(duration: 6)) {
            offset = containerSize.width + 200
        }
    }
}

// MARK: - Supporting Types
extension Danmaku {
    var track: Int {
        // 简单的轨道分配算法
        return abs(id.hashValue) % 10
    }
}

struct Color_Hex {
    // Color扩展，支持16进制颜色
}
