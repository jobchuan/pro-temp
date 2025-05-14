//
//  Video180PlayerView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Player/Video180PlayerView.swift
import SwiftUI
import AVKit
import RealityKit

struct Video180PlayerView: View {
    let content: Content
    @StateObject private var playerManager = MediaPlayerManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer?
    @State private var isShowingControls = true
    @State private var hideControlsTimer: Timer?
    
    var body: some View {
        ZStack {
            // 视频播放器
            if let player = player {
                VideoPlayer(player: player)
                    .ignoresSafeArea()
                    .gesture(
                        TapGesture()
                            .onEnded { _ in
                                toggleControls()
                            }
                    )
            } else {
                ProgressView("加载中...")
                    .scaleEffect(1.5)
            }
            
            // 播放控制界面
            if isShowingControls {
                VStack {
                    // 顶部栏
                    HStack {
                        Button {
                            dismiss()
                        } label: {
                            Image(systemName: "xmark")
                                .font(.title2)
                                .foregroundColor(.white)
                                .padding()
                                .background(Circle().fill(Color.black.opacity(0.5)))
                        }
                        
                        Spacer()
                        
                        Text(content.localizedTitle)
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Spacer()
                        
                        // 占位符，保持对称
                        Color.clear
                            .frame(width: 44, height: 44)
                    }
                    .padding()
                    
                    Spacer()
                    
                    // 底部控制栏
                    VStack(spacing: 20) {
                        // 播放进度条
                        ProgressView(value: playerManager.currentProgress, total: playerManager.duration)
                            .progressViewStyle(LinearProgressViewStyle(tint: .white))
                            .frame(height: 4)
                        
                        // 播放控制按钮
                        HStack(spacing: 40) {
                            Button {
                                // 后退10秒
                                if let currentTime = player?.currentTime() {
                                    let newTime = max(0, currentTime.seconds - 10)
                                    player?.seek(to: CMTime(seconds: newTime, preferredTimescale: 600))
                                }
                            } label: {
                                Image(systemName: "gobackward.10")
                                    .font(.title)
                                    .foregroundColor(.white)
                            }
                            
                            Button {
                                if playerManager.isPlaying {
                                    player?.pause()
                                    playerManager.isPlaying = false
                                } else {
                                    player?.play()
                                    playerManager.isPlaying = true
                                }
                            } label: {
                                Image(systemName: playerManager.isPlaying ? "pause.fill" : "play.fill")
                                    .font(.largeTitle)
                                    .foregroundColor(.white)
                            }
                            
                            Button {
                                // 前进10秒
                                if let currentTime = player?.currentTime(),
                                   let duration = player?.currentItem?.duration {
                                    let newTime = min(duration.seconds, currentTime.seconds + 10)
                                    player?.seek(to: CMTime(seconds: newTime, preferredTimescale: 600))
                                }
                            } label: {
                                Image(systemName: "goforward.10")
                                    .font(.title)
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [Color.black.opacity(0), Color.black.opacity(0.8)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
            }
        }
        .background(Color.black)
        .onAppear {
            setupPlayer()
            resetHideControlsTimer()
        }
        .onDisappear {
            player?.pause()
            hideControlsTimer?.invalidate()
        }
    }
    
    private func setupPlayer() {
        guard let url = URL(string: content.files.main.url) else { return }
        
        player = AVPlayer(url: url)
        player?.play()
        playerManager.isPlaying = true
        
        // 监听播放进度
        player?.addPeriodicTimeObserver(forInterval: CMTime(seconds: 1, preferredTimescale: 1), queue: .main) { time in
            playerManager.currentProgress = time.seconds
            if let duration = player?.currentItem?.duration.seconds {
                playerManager.duration = duration
            }
        }
    }
    
    private func toggleControls() {
        withAnimation {
            isShowingControls.toggle()
        }
        
        if isShowingControls {
            resetHideControlsTimer()
        }
    }
    
    private func resetHideControlsTimer() {
        hideControlsTimer?.invalidate()
        hideControlsTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: false) { _ in
            withAnimation {
                isShowingControls = false
            }
        }
    }
}
extension Video180PlayerView {
    static var sampleContent: Content {
        let creator = Creator(
            id: "123",
            username: "测试用户",
            email: nil,
            profile: nil
        )
        
        return Content(
            id: "1",
            title: ["zh-CN": "示例180°视频"],
            description: ["zh-CN": "这是一个示例180°视频"],
            contentType: .video180,
            files: ContentFiles(
                main: MainFile(
                    url: "https://example.com/video.mp4",
                    size: nil,
                    duration: nil,
                    resolution: nil
                ),
                thumbnail: nil,
                preview: nil
            ),
            media: nil,
            location: nil,
            creatorId: creator,
            tags: nil,
            category: .entertainment,
            pricing: Pricing(isFree: true, price: nil, currency: nil),
            stats: ContentStats(views: 0, likes: 0, favorites: 0, comments: 0, shares: 0, downloads: 0, danmakus: 0),
            status: .published,
            thumbnailURL: nil,
            createdAt: nil,
            updatedAt: nil
        )
    }
}
    #Preview {
        Video180PlayerView(content: Video180PlayerView.sampleContent)
    }
