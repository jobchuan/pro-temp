//
//  ContentDetailViewModel.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// ViewModels/ContentDetailViewModel.swift
//
//  ContentDetailViewModel.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// ViewModels/ContentDetailViewModel.swift
import Foundation
import SwiftUI


@MainActor
class ContentDetailViewModel: ObservableObject {
    @Published var isFavorited = false
    @Published var isLiked = false
    @Published var likeCount: Int = 0
    @Published var favoriteCount: Int = 0
    @Published var userHasAccess = false
    @Published var comments: [Comment] = []
    @Published var isLoadingComments = false
    @Published var interactionStatus: InteractionStatus?
    @Published var replyingTo: Comment?
    @Published var errorMessage: String?
    
    private let interactionService = InteractionService()
    private let contentId: String
    private let initialLikeCount: Int
    private let initialFavoriteCount: Int
   
    
    init(contentId: String, content: Content? = nil) {
        self.contentId = contentId
        self.initialLikeCount = content?.stats.likes ?? 0
        self.initialFavoriteCount = content?.stats.favorites ?? 0
        self.likeCount = self.initialLikeCount
        self.favoriteCount = self.initialFavoriteCount
        
    }
    
    // 播放内容
    func playContent(_ content: Content) {
        // 实现播放逻辑
        // 这里可以导航到播放器视图
        print("播放内容: \(content.localizedTitle)")
    }
    
    // 切换点赞状态
    func toggleLike(_ content: Content) async {
        do {
            try await interactionService.toggleLike(contentId: content.id)
            await MainActor.run {
                self.isLiked.toggle()
                // 更新点赞数量
                if self.isLiked {
                    self.likeCount += 1
                } else {
                    self.likeCount = max(0, self.likeCount - 1)
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "点赞操作失败: \(error.localizedDescription)"
            }
            print("切换点赞状态失败: \(error)")
        }
    }
    
    // 切换收藏状态
    func toggleFavorite(_ content: Content) async {
        do {
            try await interactionService.toggleFavorite(contentId: content.id)
            await MainActor.run {
                self.isFavorited.toggle()
                // 更新收藏数量
                if self.isFavorited {
                    self.favoriteCount += 1
                } else {
                    self.favoriteCount = max(0, self.favoriteCount - 1)
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "收藏操作失败: \(error.localizedDescription)"
            }
            print("切换收藏状态失败: \(error)")
        }
    }
    
    // 分享内容
    func shareContent(_ content: Content) {
        // 实现分享逻辑
        print("分享内容: \(content.localizedTitle)")
    }
    
    // 举报内容
    func reportContent(_ content: Content) {
        // 实现举报逻辑
        print("举报内容: \(content.localizedTitle)")
    }
    
    // 发送评论
    func sendComment(text: String, parentId: String? = nil) async {
        await MainActor.run {
            self.errorMessage = nil
        }
        
        do {
            let comment = try await interactionService.addComment(
                contentId: contentId,
                text: text,
                parentId: parentId ?? replyingTo?.id
            )
            
            // 提交成功后，重新加载评论列表以确保显示正确
            await loadComments()
            
            // 清除回复状态
            await MainActor.run {
                self.replyingTo = nil
            }
            
            print("评论提交成功: \(comment)")
        } catch {
            await MainActor.run {
                self.errorMessage = "发送评论失败: \(error.localizedDescription)"
            }
            print("发送评论失败: \(error)")
        }
    }
    
    // 开始回复评论
    func startReply(to comment: Comment) {
        self.replyingTo = comment
    }
    
    // 取消回复
    func cancelReply() {
        self.replyingTo = nil
    }
    
    // 点赞评论
    func likeComment(_ comment: Comment) async {
        // TODO: 实现评论点赞，需要后端添加相应的API
        print("点赞评论: \(comment.id)")
    }
    
    // 加载交互数据
    func loadInteractionData() async {
        await MainActor.run {
            self.isLoadingComments = true
            self.errorMessage = nil
        }
        
        do {
            // 获取交互状态（点赞、收藏等）
            let status = try await interactionService.getInteractionStatus(contentId: contentId)
            
            // 获取评论列表
            let comments = try await interactionService.getComments(contentId: contentId)
            
            await MainActor.run {
                self.interactionStatus = status
                self.isFavorited = status.favorited
                self.isLiked = status.liked
                self.comments = comments
                self.isLoadingComments = false
                
                // 同步更新计数
                if self.isLiked && self.likeCount == self.initialLikeCount {
                    self.likeCount += 1
                } else if !self.isLiked && self.likeCount > self.initialLikeCount {
                    self.likeCount = self.initialLikeCount
                }
                
                if self.isFavorited && self.favoriteCount == self.initialFavoriteCount {
                    self.favoriteCount += 1
                } else if !self.isFavorited && self.favoriteCount > self.initialFavoriteCount {
                    self.favoriteCount = self.initialFavoriteCount
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "加载数据失败: \(error.localizedDescription)"
                self.isLoadingComments = false
            }
            print("加载交互数据失败: \(error)")
        }
    }
    
    // 加载评论
    func loadComments() async {
        await MainActor.run {
            self.isLoadingComments = true
        }
        
        do {
            let comments = try await interactionService.getComments(contentId: contentId)
            await MainActor.run {
                self.comments = comments
                self.isLoadingComments = false
            }
            print("成功加载 \(comments.count) 条评论")
        } catch {
            await MainActor.run {
                self.errorMessage = "加载评论失败: \(error.localizedDescription)"
                self.isLoadingComments = false
            }
            print("加载评论失败: \(error)")
        }
    }
}

