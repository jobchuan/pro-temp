//
//  MediaPlayerManager.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Services/MediaPlayerManager.swift
import SwiftUI
import AVKit
import RealityKit

enum MediaPlayerError: Error {
    case invalidURL
    case unsupportedFormat
    case loadingFailed
}

class MediaPlayerManager: ObservableObject {
    static let shared = MediaPlayerManager()
    
    @Published var isPlaying = false
    @Published var currentProgress: Double = 0
    @Published var duration: Double = 0
    @Published var isLoading = false
    @Published var error: MediaPlayerError?
    
    private var player: AVPlayer?
    
    private init() {}
    
    // 播放视频
    func playVideo(url: String) throws {
        guard let videoURL = URL(string: url) else {
            throw MediaPlayerError.invalidURL
        }
        
        isLoading = true
        error = nil
        
        let playerItem = AVPlayerItem(url: videoURL)
        player = AVPlayer(playerItem: playerItem)
        
        // 监听播放状态
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )
        
        player?.play()
        isPlaying = true
        isLoading = false
    }
    
    // 暂停播放
    func pause() {
        player?.pause()
        isPlaying = false
    }
    
    // 继续播放
    func resume() {
        player?.play()
        isPlaying = true
    }
    
    // 停止播放
    func stop() {
        player?.pause()
        player = nil
        isPlaying = false
        currentProgress = 0
    }
    
    // 跳转到指定时间
    func seek(to time: Double) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime)
    }
    
    @objc private func playerDidFinishPlaying() {
        isPlaying = false
        currentProgress = 0
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
