//
//  CommentItemView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Components/CommentItemView.swift
import SwiftUI

struct CommentItemView: View {
    let comment: Comment
    var onReply: (() -> Void)?
    var onLike: (() -> Void)?
    var showActions: Bool = true
    @State private var showReplies = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 用户信息行
            HStack(alignment: .top) {
                // 用户头像
                Image(systemName: "person.circle.fill")
                    .font(.title)
                    .foregroundColor(.gray)
                    .frame(width: 36, height: 36)
                
                VStack(alignment: .leading, spacing: 4) {
                    // 用户名和标识
                    HStack {
                        Text(getUserName())
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        if comment.isCreatorComment {
                            Label("创作者", systemImage: "star.fill")
                                .font(.caption2)
                                .foregroundColor(.yellow)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background {
                                    Capsule()
                                        .fill(Color.yellow.opacity(0.2))
                                }
                        }
                        
                        Spacer()
                        
                        // 时间
                        Text(formatDate(comment.createdAt))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    // 评论内容
                    Text(comment.text)
                        .font(.body)
                        .fixedSize(horizontal: false, vertical: true)
                    
                    // 操作按钮
                    if showActions {
                        HStack(spacing: 20) {
                            // 点赞按钮
                            Button {
                                onLike?()
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: "heart")
                                        .font(.caption)
                                    Text("\(comment.likes)")
                                        .font(.caption)
                                }
                                .foregroundColor(.secondary)
                            }
                            .buttonStyle(.plain)
                            
                            // 回复按钮
                            Button {
                                onReply?()
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: "bubble.left")
                                        .font(.caption)
                                    Text("回复")
                                        .font(.caption)
                                }
                                .foregroundColor(.secondary)
                            }
                            .buttonStyle(.plain)
                            
                            // 查看回复按钮
                            if comment.replyCount > 0 {
                                Button {
                                    withAnimation {
                                        showReplies.toggle()
                                    }
                                } label: {
                                    HStack(spacing: 4) {
                                        Text("\(comment.replyCount) 条回复")
                                            .font(.caption)
                                        Image(systemName: showReplies ? "chevron.up" : "chevron.down")
                                            .font(.caption2)
                                    }
                                    .foregroundColor(.blue)
                                }
                                .buttonStyle(.plain)
                            }
                            
                            Spacer()
                        }
                    }
                }
            }
            
            // 回复列表
            if showReplies, let replies = comment.replies, !replies.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(replies) { reply in
                        CommentItemView(
                            comment: reply,
                            onReply: onReply,
                            onLike: onLike,
                            showActions: showActions
                        )
                        .padding(.leading, 44) // 缩进显示层级
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemGray6))
        }
    }
    
    // 获取用户名的方法
    private func getUserName() -> String {
        // 优先从 user 字段获取
        if let username = comment.user?.username, !username.isEmpty {
            return username
        }
        
        // 从 userId 获取
        switch comment.userId {
        case .string(let id):
            // 如果只是字符串ID，返回默认值
            return "用户"
        case .object(let userObject):
            // 如果是对象，返回用户名
            return userObject.username
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        formatter.locale = Locale(identifier: "zh_CN")
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}
