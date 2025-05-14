//
//  Video360PlayerView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Player/Video360PlayerView.swift
import SwiftUI
import AVKit
import SceneKit
import AVFoundation

struct Video360PlayerView: View {
    let content: Content
    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer?
    @State private var isShowingControls = true
    @State private var hideControlsTimer: Timer?
    @StateObject private var playerManager = MediaPlayerManager.shared
    
    var body: some View {
        ZStack {
            // 360度视频场景
            SceneView(
                scene: create360Scene(),
                options: [.allowsCameraControl, .autoenablesDefaultLighting]
            )
            .ignoresSafeArea()
            .gesture(
                TapGesture()
                    .onEnded { _ in
                        toggleControls()
                    }
            )
            
            // 播放控制界面（与180度视频类似）
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
                        
                        VStack {
                            Text(content.localizedTitle)
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            Text("360° 视频")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        
                        Spacer()
                        
                        // 视角重置按钮
                        Button {
                            // TODO: 重置视角
                        } label: {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.title2)
                                .foregroundColor(.white)
                                .padding()
                                .background(Circle().fill(Color.black.opacity(0.5)))
                        }
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
    
    private func create360Scene() -> SCNScene {
        let scene = SCNScene()
        
        // 创建球体几何形状（用于投影360视频）
        let sphere = SCNSphere(radius: 100)
        sphere.firstMaterial?.isDoubleSided = true
        sphere.firstMaterial?.diffuse.contents = UIColor.black
        
        // 设置视频纹理
        if let url = URL(string: content.files.main.url) {
            player = AVPlayer(url: url)
            sphere.firstMaterial?.diffuse.contents = player
            
            // 翻转纹理坐标以正确显示360视频
            sphere.firstMaterial?.diffuse.contentsTransform = SCNMatrix4MakeScale(-1, 1, 1)
            sphere.firstMaterial?.diffuse.wrapS = .repeat
            sphere.firstMaterial?.diffuse.wrapT = .repeat
        }
        
        // 创建节点并添加到场景
        let sphereNode = SCNNode(geometry: sphere)
        sphereNode.position = SCNVector3(x: 0, y: 0, z: 0)
        scene.rootNode.addChildNode(sphereNode)
        
        // 设置相机
        let cameraNode = SCNNode()
        cameraNode.camera = SCNCamera()
        cameraNode.position = SCNVector3(x: 0, y: 0, z: 0)
        scene.rootNode.addChildNode(cameraNode)
        
        return scene
    }
    
    private func setupPlayer() {
        // 播放器设置已在create360Scene中完成
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
