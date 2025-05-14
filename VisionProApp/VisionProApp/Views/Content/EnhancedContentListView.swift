//
//  EnhancedContentListView.swift
//  VisionProApp
//
//  Created on 2025/5/12.
//

import SwiftUI

// This view integrates the carousel experience into the main content flow
struct EnhancedContentListView: View {
    @StateObject private var contentService = ContentService()
    @State private var selectedContentType: Content.ContentType?
    @State private var selectedCategory: Content.ContentCategory?
    @State private var viewMode: ViewMode = .carousel
    @State private var showFilters = false
    
    enum ViewMode {
        case grid
        case carousel
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color.black.opacity(0).ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // View mode selector and filters
                    viewControls
                    
                    // Main content area
                    if contentService.isLoading && contentService.contents.isEmpty {
                        loadingView
                    } else if contentService.contents.isEmpty {
                        emptyStateView
                    } else {
                        // Show either grid or carousel based on selected view mode
                        switch viewMode {
                        case .grid:
                            contentGridView
                                .transition(.opacity)
                        case .carousel:
                            contentCarouselView
                                .transition(.opacity)
                        }
                    }
                }
            }
            .navigationTitle("探索内容")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showFilters = true
                    }) {
                        Image(systemName: "slider.horizontal.3")
                            .foregroundColor(.primary)
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                ContentFilterView()
            }
            .onAppear {
                if contentService.contents.isEmpty {
                    loadContent()
                }
            }
        }
    }
    
    // MARK: - Subviews
    
    private var viewControls: some View {
        VStack(spacing: 0) {
            // View mode selector
            HStack {
                Spacer()
                
                // Grid/Carousel selector
                HStack(spacing: 0) {
                    Button(action: {
                        withAnimation {
                            viewMode = .grid
                        }
                    }) {
                        Image(systemName: "square.grid.2x2")
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(viewMode == .grid ? Color.accentColor : Color.clear)
                            .foregroundColor(viewMode == .grid ? .white : .gray)
                            .cornerRadius(8, corners: [.topLeft, .bottomLeft])
                    }
                    
                    Button(action: {
                        withAnimation {
                            viewMode = .carousel
                        }
                    }) {
                        Image(systemName: "rectangle.3.group")
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(viewMode == .carousel ? Color.accentColor : Color.clear)
                            .foregroundColor(viewMode == .carousel ? .white : .gray)
                            .cornerRadius(8, corners: [.topRight, .bottomRight])
                    }
                }
                .background(Color.gray.opacity(0.2))
                .cornerRadius(8)
                .padding(.horizontal)
            }
            .padding(.vertical, 10)
            
            // Content type filter
            ScrollView(.horizontal, showsIndicators: false) {
                HStack {
                    FilterChip(
                        title: "全部",
                        isSelected: selectedContentType == nil
                    ) {
                        selectedContentType = nil
                        refreshContent()
                    }
                    
                    ForEach(Content.ContentType.allCases, id: \.self) { type in
                        FilterChip(
                            title: type.displayName,
                            isSelected: selectedContentType == type
                        ) {
                            selectedContentType = type
                            refreshContent()
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .background(Color(.systemBackground).opacity(0.1))
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
    
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "film.stack")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("暂无内容")
                .font(.headline)
            
            Text("还没有内容，稍后再来看看吧")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
    }
    
    private var contentGridView: some View {
        // This is similar to the existing ContentListView GridView
        let columns = [
            GridItem(.flexible(), spacing: 16),
            GridItem(.flexible(), spacing: 16),
            GridItem(.flexible(), spacing: 16)
        ]
        
        return ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(contentService.contents) { content in
                    NavigationLink(value: content) {
                        ContentGridCard(content: content)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding()
        }
        .navigationDestination(for: Content.self) { content in
            ContentDetailView(content: content)
        }
    }
    
    private var contentCarouselView: some View {
        // The new carousel experience
        ContentCarouselView()
            .navigationDestination(for: Content.self) { content in
                ContentDetailView(content: content)
            }
    }
    
    // MARK: - Helper Methods
    
    private func refreshContent() {
        loadContent(page: 1)
    }
    
    private func loadContent(page: Int = 1) {
        Task {
            await contentService.getContents(
                page: page,
                contentType: selectedContentType?.rawValue,
                category: selectedCategory?.rawValue
            )
        }
    }
}

// MARK: - Preview

#Preview {
    EnhancedContentListView()
        .preferredColorScheme(.dark)
}
