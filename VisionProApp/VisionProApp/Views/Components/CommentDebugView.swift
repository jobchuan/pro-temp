import SwiftUI

struct CommentStructureDebug: View {
    @State private var contentId = "6620d50dbd59549b7049c7c3"
    @State private var result = ""
    @State private var isLoading = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("评论数据结构调试")
                    .font(.title)
                
                TextField("内容ID", text: $contentId)
                    .textFieldStyle(.roundedBorder)
                
                Button("分析评论数据结构") {
                    analyzeComments()
                }
                .buttonStyle(.borderedProminent)
                
                if isLoading {
                    ProgressView()
                }
                
                ScrollView {
                    Text(result)
                        .font(.system(.body, design: .monospaced))
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                }
                .frame(maxHeight: 600)
            }
            .padding()
        }
    }
    
    func analyzeComments() {
        isLoading = true
        result = "分析评论数据结构...\n"
        
        Task {
            do {
                let service = InteractionService()
                let comments = try await service.getComments(contentId: contentId)
                
                result += "获取到 \(comments.count) 条评论\n\n"
                
                // 分析第一条评论的结构
                if let firstComment = comments.first {
                    result += "第一条评论的数据结构：\n"
                    result += "ID: \(firstComment.id)\n"
                    result += "Text: \(firstComment.text)\n"
                    result += "\nuserId 类型: \(type(of: firstComment.userId))\n"
                    
                    // 分析 userId
                    switch firstComment.userId {
                    case .string(let idString):
                        result += "userId 是字符串: \(idString)\n"
                    case .object(let userObject):
                        result += "userId 是对象:\n"
                        result += "  _id: \(userObject._id)\n"
                        result += "  username: \(userObject.username)\n"
                        if let profile = userObject.profile {
                            result += "  profile.displayName: \(String(describing: profile.displayName))\n"
                        }
                    }
                    
                    // 分析 user 字段
                    result += "\nuser 字段: \(firstComment.user == nil ? "nil" : "存在")\n"
                    if let user = firstComment.user {
                        result += "  user.id: \(user.id)\n"
                        result += "  user.username: \(user.username)\n"
                        result += "  user.displayName: \(String(describing: user.displayName))\n"
                        result += "  user.avatarURL: \(String(describing: user.avatarURL))\n"
                    }
                    
                    result += "\nisCreatorComment: \(firstComment.isCreatorComment)\n"
                    result += "createdAt: \(firstComment.createdAt)\n"
                }
                
                // 输出所有评论的基本信息
                result += "\n所有评论的基本信息：\n"
                for (index, comment) in comments.enumerated() {
                    result += "\n评论 #\(index + 1):\n"
                    
                    // userId 信息
                    switch comment.userId {
                    case .string(let idString):
                        result += "  userId(string): \(idString)\n"
                    case .object(let userObject):
                        result += "  userId(object): \(userObject.username)\n"
                    }
                    
                    // user 信息
                    if let user = comment.user {
                        result += "  user.username: \(user.username)\n"
                    } else {
                        result += "  user: nil\n"
                    }
                    
                    result += "  text: \(comment.text)\n"
                    result += "  isCreatorComment: \(comment.isCreatorComment)\n"
                }
                
            } catch {
                result += "错误: \(error)\n"
            }
            
            isLoading = false
        }
    }
}

#Preview {
    CommentStructureDebug()
}
