//
//  VideoPlayerViewModel.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
// ViewModels/VideoPlayerViewModel.swift
import AVKit
import SwiftUI
import Combine

@MainActor
class VideoPlayerViewModel: ObservableObject {
    @Published var player = AVPlayer()
    @Published var isPlaying = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    
    private var timeObserver: Any?
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        Task { @MainActor in
            setupPlayerObservers()
        }
    }
    
    deinit {
        Task { @MainActor in
            if let observer = timeObserver {
                player.removeTimeObserver(observer)
            }
        }
    }
    
    private func setupPlayerObservers() {
        Task { @MainActor in
            // 监听播放状态
            player.publisher(for: \.rate)
                .receive(on: DispatchQueue.main)
                .sink { [weak self] rate in
                    Task { @MainActor in
                        self?.isPlaying = rate > 0
                    }
                }
                .store(in: &cancellables)
            
            // 监听时长
            player.publisher(for: \.currentItem?.duration)
                .compactMap { $0 }
                .filter { !$0.isIndefinite }
                .receive(on: DispatchQueue.main)
                .sink { [weak self] duration in
                    Task { @MainActor in
                        self?.duration = duration.seconds
                    }
                }
                .store(in: &cancellables)
            
            // 添加时间观察者
            let interval = CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
            timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
                Task { @MainActor in
                    self?.currentTime = time.seconds
                }
            }
        }
    }
 
    
    func setupPlayer(with urlString: String) {
        guard let url = URL(string: urlString) else { return }
        
        let playerItem = AVPlayerItem(url: url)
        player.replaceCurrentItem(with: playerItem)
    }
    
    func togglePlayPause() {
        if isPlaying {
            player.pause()
        } else {
            player.play()
        }
    }
    
    func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        player.seek(to: cmTime)
    }
    
    func seek(by seconds: TimeInterval) {
        let newTime = currentTime + seconds
        seek(to: max(0, min(newTime, duration)))
    }
    
    func setVolume(_ volume: Float) {
        player.volume = volume
    }
    
    // Picture in Picture support
    func startPictureInPicture() {
        // visionOS 的画中画实现需要根据具体API调整
    }
    
    func stopPictureInPicture() {
        // visionOS 的画中画实现需要根据具体API调整
    }
}
