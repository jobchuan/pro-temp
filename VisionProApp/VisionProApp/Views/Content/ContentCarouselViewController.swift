//
//  ContentCarouselViewController.swift
//  VisionProApp
//
//  Created on 2025/5/12.
//

import SwiftUI
import UIKit

// UIKit wrapper for ContentCarouselView (optional but recommended for deeper integration)
class ContentCarouselViewController: UIViewController {
    private var hostingController: UIHostingController<ContentCarouselContainerView>!
    private let contentService = ContentService()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Create the SwiftUI view
        let contentCarouselView = ContentCarouselContainerView(
            contentService: contentService,
            onContentSelected: { [weak self] content in
                self?.navigateToDetail(content: content)
            }
        )
        
        // Setup hosting controller
        hostingController = UIHostingController(rootView: contentCarouselView)
        
        // Add as child view controller
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        hostingController.didMove(toParent: self)
    }
    
    private func navigateToDetail(content: Content) {
        // Implement navigation to detail screen
        let detailVC = ContentDetailViewController(content: content)
        navigationController?.pushViewController(detailVC, animated: true)
    }
}

// SwiftUI container view with dependency injection
struct ContentCarouselContainerView: View {
    let contentService: ContentService
    let onContentSelected: (Content) -> Void
    
    @State private var contents: [Content] = []
    @State private var currentIndex = 0
    @State private var dragOffset: CGFloat = 0
    @State private var isDragging = false
    @State private var isLoading = true
    @State private var isLoadingMore = false
    
    // Card configuration
    private let cardWidth: CGFloat = 500 // Fixed width for visionOS
    private let cardSpacing: CGFloat = 20
    private let sideCardScale: CGFloat = 0.85
    private let sideCardOpacity: CGFloat = 0.8
    private let sideCardOffset: CGFloat = 40
    
    var body: some View {
        ZStack {
            // Background
            Color.black.ignoresSafeArea()
            
            if isLoading {
                loadingView
            } else {
                carouselView
            }
        }
        .onAppear {
            loadContents()
        }
        .navigationTitle("探索内容")
        .navigationBarTitleDisplayMode(.large)
    }
    
    // MARK: - Subviews
    
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
            ZStack {
                // Main carousel
                carouselStack(in: geometry)
                
                // Navigation controls
                navigationControls
            }
        }
        .statusBar(hidden: true)
    }
    
    private func carouselStack(in geometry: GeometryProxy) -> some View {
        HStack(spacing: cardSpacing) {
            ForEach(0..<contents.count, id: \.self) { index in
                ContentCard(
                    content: contents[index],
                    onPlay: {
                        onContentSelected(contents[index])
                    }
                )
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
                        
                        // Load more content when approaching the end
                        if currentIndex >= contents.count - 3 {
                            loadMoreContents()
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
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isDragging)
    }
    
    private var navigationControls: some View {
        VStack {
            Spacer()
            
            HStack {
                // Previous button
                Button(action: {
                    if currentIndex > 0 {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
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
                    
                    if isLoadingMore {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(0.7)
                    }
                }
                
                Spacer()
                
                // Next button
                Button(action: {
                    if currentIndex < contents.count - 1 {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                            currentIndex += 1
                        }
                        
                        // Load more content when approaching the end
                        if currentIndex >= contents.count - 3 {
                            loadMoreContents()
                        }
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
        } else if distance <= 1 {
            return sideCardScale // Adjacent cards
        } else {
            return 0.7 // Further cards
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
        } else if distance <= 2 {
            return 0.5 // Further cards
        } else {
            return 0.0 // Hide cards beyond that
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
        isLoading = true
        Task {
            await contentService.getContents()
            await MainActor.run {
                self.contents = contentService.contents
                self.isLoading = false
            }
        }
    }
    
    private func loadMoreContents() {
        guard !isLoadingMore else { return }
        
        isLoadingMore = true
        Task {
            // Get next page
            let nextPage = (contents.count / 20) + 1
            await contentService.getContents(page: nextPage)
            
            await MainActor.run {
                // Append new content
                contents.append(contentsOf: contentService.contents)
                isLoadingMore = false
            }
        }
    }
}

// MARK: - UIKit Integration

class ContentDetailViewController: UIViewController {
    let content: Content
    
    init(content: Content) {
        self.content = content
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Setup content detail view controller
        let contentDetailView = ContentDetailView(content: content)
        let hostingController = UIHostingController(rootView: contentDetailView)
        
        // Add as child view controller
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        hostingController.didMove(toParent: self)
    }
}

// MARK: - Preview

#Preview {
    ContentCarouselContainerView(
        contentService: ContentService(),
        onContentSelected: { _ in }
    )
    .preferredColorScheme(.dark)
}
