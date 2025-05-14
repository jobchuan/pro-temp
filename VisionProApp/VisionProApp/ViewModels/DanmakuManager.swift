//
//  DanmakuManager.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// ViewModels/DanmakuManager.swift
import SwiftUI
import Combine

class DanmakuManager: ObservableObject {
    @Published var visibleDanmakus: [Danmaku] = []
    
    private var allDanmakus: [Danmaku] = []
    private var currentTime: TimeInterval = 0
    private let displayDuration: TimeInterval = 6.0
    private var timer: Timer?
    
    func startForContent(_ contentId: String) {
        loadDanmakus(for: contentId)
        startTimer()
    }
    
    func updateTime(_ time: TimeInterval) {
        currentTime = time
        updateVisibleDanmakus()
    }
    
    private func loadDanmakus(for contentId: String) {
        Task {
            do {
                let service = InteractionService()
                allDanmakus = try await service.getDanmakuList(contentId: contentId)
            } catch {
                print("加载弹幕失败: \(error)")
            }
        }
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateVisibleDanmakus()
        }
    }
    
    private func updateVisibleDanmakus() {
        visibleDanmakus = allDanmakus.filter { danmaku in
            let startTime = danmaku.timestamp
            let endTime = startTime + displayDuration
            return currentTime >= startTime && currentTime <= endTime
        }
    }
    
    deinit {
        timer?.invalidate()
    }
}
