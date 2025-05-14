//
//  ContentCarouselView.swift
//  VisionProApp
//
//  Created on 2025/5/12.
//

import SwiftUI

struct ContentCarouselView: View {
    @StateObject private var contentService = ContentService()
    @State private var contents: [Content] = []
    @State private var currentIndex = 0
    @State private var dragOffset: CGFloat = 0
    @State private var isDragging = false
    
    // Card configuration
    private let cardWidth: CGFloat = 500 // Fixed width for visionOS
    private let cardSpacing: CGFloat = 20
    private let sideCardScale: CGFloat = 0.85
    private let sideCardOpacity: CGFloat = 0.8
    private let sideCardOffset: CGFloat = 40
    
    var body: some View {
        ZStack {
            // Background
            Color.black.opacity(0).ignoresSafeArea()
            
            if contents.isEmpty {
                loadingView
            } else {
                carouselView
            }
        }
        .onAppear {
            loadContents()
        }
    }
    
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
    
    private var carouselView: some View {
        GeometryReader { geometry in
            HStack(spacing: cardSpacing) {
                ForEach(0..<contents.count, id: \.self) { index in
                    ContentCard(content: contents[index], onPlay: {
                        // 处理播放动作
                        print("播放内容: \(contents[index].localizedTitle)")
                    })
                    .frame(width: cardWidth)
                    .scaleEffect(contentCardScale(for: index))
                    .opacity(contentCardOpacity(for: index))
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
                        
                        // Determine if we should move to the next/previous card
                        let cardThreshold = cardWidth / 3
                        
                        if value.translation.width < -cardThreshold && currentIndex < contents.count - 1 {
                            // Swipe left - move to next card
                            withAnimation {
                                currentIndex += 1
                                dragOffset = 0
                            }
                        } else if value.translation.width > cardThreshold && currentIndex > 0 {
                            // Swipe right - move to previous card
                            withAnimation {
                                currentIndex -= 1
                                dragOffset = 0
                            }
                        } else {
                            // Reset to current card
                            withAnimation {
                                dragOffset = 0
                            }
                        }
                    }
            )
            .animation(.spring, value: dragOffset)
            
            // Navigation controls
            VStack {
                Spacer()
                
                HStack {
                    // Previous button
                    Button(action: {
                        if currentIndex > 0 {
                            withAnimation {
                                currentIndex -= 1
                            }
                        }
                    }) {
                        Image(systemName: "chevron.left.circle.fill")
                            .font(.system(size: 36))
                            .foregroundColor(.white)
                            .opacity(currentIndex > 0 ? 1.0 : 0.3)
                    }
                    .disabled(currentIndex <= 0)
                    
                    Spacer()
                    
                    // Page indicator
                    HStack(spacing: 8) {
                        ForEach(0..<min(contents.count, 5), id: \.self) { index in
                            Circle()
                                .fill(currentIndex == index ? Color.white : Color.white.opacity(0.3))
                                .frame(width: 8, height: 8)
                        }
                    }
                    
                    Spacer()
                    
                    // Next button
                    Button(action: {
                        if currentIndex < contents.count - 1 {
                            withAnimation {
                                currentIndex += 1
                            }
                        } else {
                            // Load more content when reaching the end
                            loadMoreContents()
                        }
                    }) {
                        Image(systemName: "chevron.right.circle.fill")
                            .font(.system(size: 36))
                            .foregroundColor(.white)
                            .opacity(currentIndex < contents.count - 1 ? 1.0 : 0.3)
                    }
                    .disabled(currentIndex >= contents.count - 1)
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 30)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func calculateHStackOffset(in geometry: GeometryProxy) -> CGFloat {
        let totalCardWidth = cardWidth + cardSpacing
        let centerPosition = (geometry.size.width - cardWidth) / 2
        let offset = centerPosition - CGFloat(currentIndex) * totalCardWidth
        return offset + dragOffset
    }
    
    private func contentCardScale(for index: Int) -> CGFloat {
        let distance = abs(CGFloat(index - currentIndex))
        
        // Apply drag effect to scale
        if isDragging {
            let dragDirection = dragOffset < 0 ? 1.0 : -1.0
            let dragMagnitude = min(abs(dragOffset) / cardWidth, 1.0)
            if index == currentIndex {
                // Current card gets smaller when dragging
                return 1.0 - (1.0 - sideCardScale) * dragMagnitude
            } else if index == currentIndex + Int(dragDirection) {
                // Next/prev card (in drag direction) gets bigger
                return sideCardScale + (1.0 - sideCardScale) * dragMagnitude
            }
        }
        
        // Normal scaling
        if distance == 0 {
            return 1.0 // Current card
        } else {
            return sideCardScale // Side cards
        }
    }
    
    private func contentCardOpacity(for index: Int) -> Double {
        let distance = abs(CGFloat(index - currentIndex))
        
        // Apply drag effect to opacity
        if isDragging {
            let dragDirection = dragOffset < 0 ? 1.0 : -1.0
            let dragMagnitude = min(abs(dragOffset) / cardWidth, 1.0)
            if index == currentIndex {
                // Current card becomes slightly transparent when dragging
                return 1.0 - (1.0 - sideCardOpacity) * dragMagnitude
            } else if index == currentIndex + Int(dragDirection) {
                // Next/prev card (in drag direction) becomes more opaque
                return sideCardOpacity + (1.0 - sideCardOpacity) * dragMagnitude
            }
        }
        
        // Normal opacity
        if distance == 0 {
            return 1.0 // Current card
        } else if distance <= 1 {
            return sideCardOpacity // Adjacent cards
        } else {
            return 0.5 // Further cards
        }
    }
    
    private func contentCardOffset(for index: Int) -> CGFloat {
        if isDragging {
            let dragDirection = dragOffset < 0 ? 1.0 : -1.0
            let dragMagnitude = min(abs(dragOffset) / cardWidth, 1.0)
            
            if index == currentIndex {
                // Current card moves in the direction of drag slightly
                return dragDirection * sideCardOffset * dragMagnitude
            } else if index == currentIndex + Int(dragDirection) {
                // Next/prev card (in drag direction) moves toward center
                return (index < currentIndex ? sideCardOffset : -sideCardOffset) * (1.0 - dragMagnitude)
            }
        }
        
        if index < currentIndex {
            return -sideCardOffset
        } else if index > currentIndex {
            return sideCardOffset
        }
        return 0 // Current card
    }
    
    // MARK: - Data Loading
    
    private func loadContents() {
        Task {
            await contentService.getContents()
            await MainActor.run {
                self.contents = contentService.contents
            }
        }
    }
    
    private func loadMoreContents() {
        // Implement pagination or fetch more content
        Task {
            await contentService.getContents(page: 2)
            await MainActor.run {
                contents.append(contentsOf: contentService.contents)
            }
        }
    }
}

// MARK: - Content Card View

struct ContentCard: View {
    let content: Content
    let onPlay: () -> Void
    @State private var showDetails = false
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottom) {
                // Content image/preview
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
                    .cornerRadius(20)
                } else {
                    defaultBackground
                        .frame(height: geometry.size.height * 0.9)
                        .cornerRadius(20)
                }
                
                // Content details
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(content.localizedTitle)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        // Play button
                        Button(action: onPlay) {
                            Image(systemName: "play.fill")
                                .font(.title3)
                                .foregroundColor(.white)
                                .frame(width: 40, height: 40)
                                .background(Circle().fill(Color.blue))
                        }
                    }
                    
                    // Show additional details when expanded
                    if showDetails {
                        VStack(alignment: .leading, spacing: 10) {
                            if let description = content.description?["zh-CN"] {
                                Text(description)
                                    .font(.body)
                                    .foregroundColor(.white.opacity(0.8))
                                    .lineLimit(3)
                            }
                            
                            HStack {
                                Text(contentTypeDisplayName(content.contentType))
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Capsule().fill(Color.blue.opacity(0.7)))
                                
                                Text(categoryDisplayName(content.category))
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Capsule().fill(Color.purple.opacity(0.7)))
                            }
                            
                            HStack {
                                Label("\(content.stats.views)", systemImage: "eye")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))
                                
                                Label("\(content.stats.likes)", systemImage: "heart")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))
                                
                                Spacer()
                                
                                if content.pricing.isFree {
                                    Text("免费")
                                        .font(.caption)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(Capsule().fill(Color.green.opacity(0.7)))
                                } else {
                                    Text(content.formattedPrice)
                                        .font(.caption)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(Capsule().fill(Color.orange.opacity(0.7)))
                                }
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
                .padding(16)
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [.clear, .black.opacity(0.8)]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .cornerRadius(20, corners: [.bottomLeft, .bottomRight])
            }
            .cornerRadius(20)
            .shadow(color: .black.opacity(0.5), radius: 10, x: 0, y: 5)
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
    
    private func categoryDisplayName(_ category: Content.ContentCategory) -> String {
        switch category {
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

// MARK: - Preview

#Preview {
    ContentCarouselView()
        .preferredColorScheme(.dark)
}
