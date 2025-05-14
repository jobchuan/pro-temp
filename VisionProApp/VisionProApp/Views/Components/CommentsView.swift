//
//  CommentsView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//

// Views/Components/CommentsView.swift
import SwiftUI
import RealityKit

struct CommentsOverlay: View {
    let contentId: String
    @ObservedObject var interactionService: InteractionService
    @Binding var spatialMode: Bool
    
    @State private var newCommentText = ""
    @State private var replyingTo: Comment?
    @State private var showingSpatialPicker = false
    @State private var selectedSpatialAnchor: SpatialAnchor?
    
    var body: some View {
        HStack {
            Spacer()
            
            VStack {
                // 评论模式切换
                HStack {
                    Button(action: {
                        spatialMode.toggle()
                        if spatialMode {
                            showingSpatialPicker = true
                        }
                    }) {
                        Label(
                            spatialMode ? "空间评论" : "普通评论",
                            systemImage: spatialMode ? "cube" : "bubble.left"
                        )
                    }
                    .buttonStyle(.bordered)
                    
                    Spacer()
                }
                .padding()
                
                // 评论列表
                ScrollView {
                    LazyVStack(spacing: 16) {
                        if let comments = interactionService.comments[contentId] {
                            ForEach(comments) { comment in
                                CommentItemView(
                                    comment: comment,
                                    onReply: { replyingTo = comment },
                                    onLike: { likeComment(comment) }
                                )
                            }
                        }
                    }
                    .padding()
                }
                
                // 输入框
                VStack {
                    if let replyingTo = replyingTo {
                        HStack {
                            Text("回复 @\(replyingTo.user?.username ?? "")")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Spacer()
                            Button("取消") {
                                self.replyingTo = nil
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    HStack {
                        TextField("添加评论...", text: $newCommentText)
                            .textFieldStyle(.roundedBorder)
                        
                        Button(action: sendComment) {
                            Image(systemName: "paperplane.fill")
                        }
                        .disabled(newCommentText.isEmpty)
                    }
                    .padding()
                }
            }
            .frame(width: 400)
            .background(Color.black.opacity(0.8))
            .cornerRadius(12)
        }
        .sheet(isPresented: $showingSpatialPicker) {
            SpatialAnchorPicker(selectedAnchor: $selectedSpatialAnchor)
        }
    }
    
    private func sendComment() {
        guard !newCommentText.isEmpty else { return }
        
        Task {
            do {
                let _ = try await interactionService.addComment(
                    contentId: contentId,
                    text: newCommentText,
                    parentId: replyingTo?.id,
                    spatialAnchor: selectedSpatialAnchor
                )
                
                newCommentText = ""
                replyingTo = nil
                selectedSpatialAnchor = nil
            } catch {
                print("发送评论失败: \(error)")
            }
        }
    }
    
    private func likeComment(_ comment: Comment) {
        // TODO: 实现评论点赞
    }
}

// MARK: - Spatial Comment Anchors
struct SpatialCommentAnchors: View {
    let contentId: String
    let currentTime: TimeInterval
    
    var body: some View {
        RealityView { content in
            // 加载空间评论锚点
            // TODO: 实现AR空间中的评论显示
        }
    }
}

// MARK: - Spatial Anchor Picker
struct SpatialAnchorPicker: View {
    @Binding var selectedAnchor: SpatialAnchor?
    @Environment(\.dismiss) private var dismiss
    
    @State private var positionX: Double = 0
    @State private var positionY: Double = 0
    @State private var positionZ: Double = -2
    @State private var rotation = Rotation3D(x: 0, y: 0, z: 0, w: 1)
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("位置")) {
                    Slider(value: $positionX, in: -5...5) {
                        Text("X: \(positionX, specifier: "%.2f")")
                    }
                    
                    Slider(value: $positionY, in: -5...5) {
                        Text("Y: \(positionY, specifier: "%.2f")")
                    }
                    
                    Slider(value: $positionZ, in: -10...0) {
                        Text("Z: \(positionZ, specifier: "%.2f")")
                    }
                }
                
                Section(header: Text("预览")) {
                    // TODO: 3D预览
                    Text("3D预览区域")
                        .frame(height: 200)
                        .frame(maxWidth: .infinity)
                        .background(Color.gray.opacity(0.2))
                }
            }
            .navigationTitle("选择空间位置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("确定") {
                        selectedAnchor = SpatialAnchor(
                            position: Position3D(
                                x: positionX,
                                y: positionY,
                                z: positionZ
                            ),
                            rotation: rotation,
                            timestamp: nil
                        )
                        dismiss()
                    }
                }
            }
        }
    }
}
