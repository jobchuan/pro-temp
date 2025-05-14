//
//  ContentFilterView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Content/ContentFilterView.swift
import SwiftUI

struct ContentFilterView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var contentManager = ContentManager.shared
    @State private var selectedCategory: Content.ContentCategory?
    @State private var selectedContentType: Content.ContentType?
    
    var body: some View {
        NavigationStack {
            List {
                // 内容分类
                Section("内容分类") {
                    ForEach(Content.ContentCategory.allCases, id: \.self) { category in
                        HStack {
                            Text(categoryDisplayName(category))
                            Spacer()
                            if selectedCategory == category {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.accentColor)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedCategory == category {
                                selectedCategory = nil
                            } else {
                                selectedCategory = category
                            }
                        }
                    }
                }
                
                // 内容类型
                Section("内容类型") {
                    ForEach(Content.ContentType.allCases, id: \.self) { type in
                        HStack {
                            Text(contentTypeDisplayName(type))
                            Spacer()
                            if selectedContentType == type {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.accentColor)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedContentType == type {
                                selectedContentType = nil
                            } else {
                                selectedContentType = type
                            }
                        }
                    }
                }
            }
            .navigationTitle("筛选")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("应用") {
                        Task {
                            await contentManager.applyFilters(
                                category: selectedCategory,
                                contentType: selectedContentType
                            )
                            dismiss()
                        }
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .onAppear {
            selectedCategory = contentManager.selectedCategory
            selectedContentType = contentManager.selectedContentType
        }
    }
    
    private func categoryDisplayName(_ category: Content.ContentCategory) -> String {
        switch category {
        case .travel:
            return "旅行"
        case .education:
            return "教育"
        case .entertainment:
            return "娱乐"
        case .sports:
            return "体育"
        case .news:
            return "新闻"
        case .documentary:
            return "纪录片"
        case .art:
            return "艺术"
        case .other:
            return "其他"
        }
    }
    
    private func contentTypeDisplayName(_ type: Content.ContentType) -> String {
        switch type {
        case .video180:
            return "180° 视频"
        case .photo180:
            return "180° 照片"
        case .video360:
            return "360° 视频"
        case .photo360:
            return "360° 照片"
        case .spatialVideo:
            return "空间视频"
        case .spatialPhoto:
            return "空间照片"
        }
    }
}

#Preview {
    ContentFilterView()
}
