//
//  ContentUploadView.swift
//  VisionProApp
//
//  Created on 2025/5/12.
//

import SwiftUI
import UniformTypeIdentifiers

struct ContentUploadView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var contentManager = ContentManager.shared
    
    @State private var title = ""
    @State private var description = ""
    @State private var selectedContentType: Content.ContentType = .video360
    @State private var selectedCategory: Content.ContentCategory = .entertainment
    @State private var isFree = true
    @State private var price: Double = 0.0
    @State private var isUploading = false
    @State private var uploadProgress: Double = 0.0
    @State private var errorMessage: String?
    @State private var selectedFile: URL?
    @State private var selectedThumbnail: URL?
    @State private var tags: [String] = []
    @State private var newTag = ""
    
    var body: some View {
        NavigationStack {
            Form {
                // 基本信息部分
                Section("基本信息") {
                    TextField("标题", text: $title)
                    
                    TextEditor(text: $description)
                        .frame(height: 100)
                        .overlay(
                            RoundedRectangle(cornerRadius: 5)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                        .overlay(
                            Group {
                                if description.isEmpty {
                                    Text("添加描述...")
                                        .foregroundColor(.gray)
                                        .padding(.horizontal, 4)
                                        .padding(.vertical, 8)
                                        .allowsHitTesting(false)
                                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                                }
                            }
                        )
                    
                    Picker("内容类型", selection: $selectedContentType) {
                        ForEach(Content.ContentType.allCases, id: \.self) { type in
                            Text(contentTypeDisplayName(type))
                                .tag(type)
                        }
                    }
                    
                    Picker("分类", selection: $selectedCategory) {
                        ForEach(Content.ContentCategory.allCases, id: \.self) { category in
                            Text(categoryDisplayName(category))
                                .tag(category)
                        }
                    }
                }
                
                // 文件选择部分
                Section("文件选择") {
                    Button {
                        selectMainFile()
                    } label: {
                        HStack {
                            Text(selectedFile != nil ? "已选择文件" : "选择主文件")
                            Spacer()
                            if let fileName = selectedFile?.lastPathComponent {
                                Text(fileName)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            } else {
                                Image(systemName: "plus.circle")
                            }
                        }
                    }
                    
                    Button {
                        selectThumbnail()
                    } label: {
                        HStack {
                            Text(selectedThumbnail != nil ? "已选择缩略图" : "选择缩略图")
                            Spacer()
                            if let fileName = selectedThumbnail?.lastPathComponent {
                                Text(fileName)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            } else {
                                Image(systemName: "plus.circle")
                            }
                        }
                    }
                }
                
                // 标签部分
                Section("标签") {
                    HStack {
                        TextField("添加标签", text: $newTag)
                        Button {
                            addTag()
                        } label: {
                            Image(systemName: "plus.circle")
                        }
                        .disabled(newTag.isEmpty)
                    }
                    
                    if !tags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(tags, id: \.self) { tag in
                                    HStack {
                                        Text(tag)
                                        Button {
                                            removeTag(tag)
                                        } label: {
                                            Image(systemName: "xmark.circle.fill")
                                                .font(.caption)
                                        }
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.blue.opacity(0.2))
                                    .cornerRadius(8)
                                }
                            }
                        }
                    }
                }
                
                // 定价部分
                Section("定价") {
                    Toggle("免费", isOn: $isFree)
                    
                    if !isFree {
                        HStack {
                            Text("价格")
                            Spacer()
                            TextField("", value: $price, format: .number)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                            Text("CNY")
                        }
                    }
                }
                
                // 上传按钮
                Section {
                    Button {
                        uploadContent()
                    } label: {
                        if isUploading {
                            HStack {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                Text("上传中... \(Int(uploadProgress * 100))%")
                            }
                            .frame(maxWidth: .infinity)
                        } else {
                            Text("上传")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .disabled(isUploading || !isFormValid)
                    .buttonStyle(.borderedProminent)
                }
                
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("上传内容")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }
            }
            .disabled(isUploading)
            .alert("上传成功", isPresented: $contentManager.isSuccessAlertShown) {
                Button("确定") {
                    dismiss()
                }
            } message: {
                Text("您的内容已上传成功，正在审核中")
            }
        }
    }
    
    private var isFormValid: Bool {
        !title.isEmpty && selectedFile != nil
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
        case .sports: return "体育"
        case .news: return "新闻"
        case .documentary: return "纪录片"
        case .art: return "艺术"
        case .other: return "其他"
        }
    }
    
    private func addTag() {
        guard !newTag.isEmpty, !tags.contains(newTag) else { return }
        tags.append(newTag)
        newTag = ""
    }
    
    private func removeTag(_ tag: String) {
        tags.removeAll { $0 == tag }
    }
    
    private func selectMainFile() {
        let picker = DocumentPickerView(
            supportedTypes: supportedContentTypes(),
            onPickURL: { url in
                self.selectedFile = url
            }
        )
        let controller = UIHostingController(rootView: picker)
        UIApplication.shared.windows.first?.rootViewController?.present(controller, animated: true)
    }
    
    private func selectThumbnail() {
        let picker = DocumentPickerView(
            supportedTypes: [UTType.jpeg, UTType.png, UTType.image],
            onPickURL: { url in
                self.selectedThumbnail = url
            }
        )
        let controller = UIHostingController(rootView: picker)
        UIApplication.shared.windows.first?.rootViewController?.present(controller, animated: true)
    }
    
    private func supportedContentTypes() -> [UTType] {
        switch selectedContentType {
        case .video180, .video360, .spatialVideo:
            return [UTType.movie, UTType.video, UTType.mpeg4Movie, UTType.quickTimeMovie]
        case .photo180, .photo360, .spatialPhoto:
            return [UTType.image, UTType.jpeg, UTType.png, UTType.heic]
        }
    }
    
    private func uploadContent() {
        guard isFormValid, let fileURL = selectedFile else {
            errorMessage = "请填写必要信息并选择文件"
            return
        }
        
        isUploading = true
        errorMessage = nil
        
        Task {
            do {
                // 创建带本地化支持的标题和描述
                let titleDict = ["zh-CN": title, "en-US": title]
                let descriptionDict = description.isEmpty ? nil : ["zh-CN": description, "en-US": description]
                
                // 准备定价数据
                let pricing: [String: Any] = [
                    "isFree": isFree,
                    "price": isFree ? 0 : price,
                    "currency": "CNY"
                ]
                
                // 上传内容
                let _ = try await contentManager.uploadContent(
                    title: titleDict,
                    description: descriptionDict,
                    contentType: selectedContentType.rawValue,
                    fileURL: fileURL,
                    thumbnailURL: selectedThumbnail,
                    tags: tags.isEmpty ? nil : tags,
                    category: selectedCategory.rawValue,
                    pricing: pricing,
                    onProgress: { progress in
                        Task { @MainActor in
                            self.uploadProgress = progress
                        }
                    }
                )
                
                await MainActor.run {
                    isUploading = false
                    uploadProgress = 0
                    contentManager.isSuccessAlertShown = true
                }
            } catch {
                await MainActor.run {
                    isUploading = false
                    errorMessage = "上传失败：\(error.localizedDescription)"
                }
            }
        }
    }
}

// 文档选择器视图
struct DocumentPickerView: UIViewControllerRepresentable {
    let supportedTypes: [UTType]
    let onPickURL: (URL) -> Void
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: supportedTypes)
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = false
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPickerView
        
        init(_ parent: DocumentPickerView) {
            self.parent = parent
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            
            // 开始访问安全范围资源
            guard url.startAccessingSecurityScopedResource() else {
                // 处理失败
                return
            }
            
            // 完成时释放安全范围资源
            defer { url.stopAccessingSecurityScopedResource() }
            
            // 在应用的文档目录中创建文件的本地副本
            let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            let localURL = documentsDirectory.appendingPathComponent(url.lastPathComponent)
            
            do {
                // 删除任何现有文件
                try? FileManager.default.removeItem(at: localURL)
                // 复制文件
                try FileManager.default.copyItem(at: url, to: localURL)
                
                // 使用本地URL调用完成处理程序
                parent.onPickURL(localURL)
            } catch {
                print("复制文件错误: \(error)")
            }
        }
    }
}

// 内容播放导航目标
enum PlayerDestination: Hashable {
    case video180(Content)
    case video360(Content)
    case spatialVideo(Content)
    case photo(Content, mode: PhotoViewMode)
    
    enum PhotoViewMode: Hashable {
        case photo180
        case photo360
        case spatialPhoto
    }
}

// 在ContentListView中添加一个预览函数
#Preview {
    ContentUploadView()
}
