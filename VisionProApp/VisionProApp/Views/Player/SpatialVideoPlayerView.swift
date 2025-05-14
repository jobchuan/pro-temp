//
//  SpatialVideoPlayerView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Player/SpatialVideoPlayerView.swift
import SwiftUI
import AVKit
import RealityKit

struct SpatialVideoPlayerView: View {
    let content: Content
    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer?
    @StateObject private var playerManager = MediaPlayerManager.shared
    
    var body: some View {
        ZStack {
            // 空间视频播放器
            RealityView { content in
                // 创建空间视频实体
                if let url = URL(string: self.content.files.main.url) {
                    let player = AVPlayer(url: url)
                    self.player = player
                    
                    // 创建视频材质
                    let videoMaterial = VideoMaterial(avPlayer: player)
                    
                    // 创建平面网格
                    let mesh = MeshResource.generatePlane(width: 4, depth: 2.25) // 16:9 比例
                    
                    // 创建实体
                    let videoEntity = ModelEntity(mesh: mesh, materials: [videoMaterial])
                    videoEntity.position = [0, 1.5, -3] // 放在用户前方
                    
                    content.add(videoEntity)
                    
                    // 开始播放
                    player.play()
                }
            }
            .ignoresSafeArea()
            
            // 空间控制面板
            VStack {
                Spacer()
                
                HStack(spacing: 30) {
                    // 关闭按钮
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.largeTitle)
                            .foregroundStyle(.white, .black.opacity(0.5))
                    }
                    
                    // 播放/暂停
                    Button {
                        if playerManager.isPlaying {
                            player?.pause()
                            playerManager.isPlaying = false
                        } else {
                            player?.play()
                            playerManager.isPlaying = true
                        }
                    } label: {
                        Image(systemName: playerManager.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(.white, .black.opacity(0.5))
                    }
                    
                    // 音量控制
                    HStack {
                        Image(systemName: "speaker.fill")
                            .foregroundColor(.white)
                        
                        Slider(value: Binding(
                            get: { player?.volume ?? 1.0 },
                            set: { player?.volume = $0 }
                        ))
                        .frame(width: 150)
                        
                        Image(systemName: "speaker.wave.3.fill")
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                    .background(
                        Capsule()
                            .fill(Color.black.opacity(0.5))
                    )
                }
                .padding(.bottom, 30)
            }
        }
        .onAppear {
            playerManager.isPlaying = true
        }
        .onDisappear {
            player?.pause()
        }
    }
}
