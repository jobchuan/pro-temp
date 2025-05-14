import SwiftUI

struct CommentParsingDebug: View {
    @State private var result = ""
    @State private var isLoading = false
    @State private var contentId = "6620d50dbd59549b7049c7c3" // 从你的错误信息中获取
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("评论解析调试")
                    .font(.title)
                
                TextField("内容ID", text: $contentId)
                    .textFieldStyle(.roundedBorder)
                
                Button("测试原始API") {
                    testRawAPI()
                }
                .buttonStyle(.borderedProminent)
                
                Button("测试解析评论") {
                    testParseComment()
                }
                .buttonStyle(.bordered)
                
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
                .frame(maxHeight: 400)
            }
            .padding()
        }
    }
    
    func testRawAPI() {
        isLoading = true
        result = "测试原始API...\n"
        
        Task {
            do {
                let url = URL(string: "http://localhost:5001/api/interactions/content/\(contentId)/comments")!
                
                var request = URLRequest(url: url)
                request.httpMethod = "GET"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                if let token = NetworkManager.shared.getToken() {
                    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                }
                
                let (data, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse {
                    result += "状态码: \(httpResponse.statusCode)\n"
                }
                
                if let jsonString = String(data: data, encoding: .utf8) {
                    result += "\n原始响应:\n\(jsonString)\n"
                    
                    // 尝试解析为字典查看结构
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        result += "\n解析后的结构:\n"
                        if let dataObj = json["data"] as? [String: Any] {
                            for (key, value) in dataObj {
                                result += "  \(key): \(type(of: value))\n"
                                
                                // 如果是评论数组，检查第一个评论的结构
                                if key == "comments", let comments = value as? [[String: Any]], let firstComment = comments.first {
                                    result += "\n  第一个评论的结构:\n"
                                    for (commentKey, commentValue) in firstComment {
                                        result += "    \(commentKey): \(type(of: commentValue)) = \(commentValue)\n"
                                        
                                        // 特别检查日期字段
                                        if commentKey == "createdAt" || commentKey == "updatedAt" {
                                            result += "      ⚠️ 日期值: \(commentValue)\n"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
            } catch {
                result += "错误: \(error)\n"
            }
            isLoading = false
        }
    }
    
    func testParseComment() {
        isLoading = true
        result = "测试解析评论...\n"
        
        Task {
            do {
                // 创建一个测试评论数据
                let testCommentData = """
                {
                    "_id": "6820d939bd59549b7049c84b",
                    "contentId": "\(contentId)",
                    "userId": {
                        "_id": "68201bc7ff4f1c2ac150e9ae",
                        "username": "job",
                        "profile": {
                            "displayName": {
                                "zh-CN": "",
                                "en-US": "",
                                "ja-JP": "",
                                "ko-KR": ""
                            }
                        }
                    },
                    "text": "测试评论",
                    "level": 0,
                    "status": "active",
                    "likes": 0,
                    "replyCount": 0,
                    "isPinned": false,
                    "isCreatorComment": true,
                    "createdAt": "2025-05-11T17:07:05.098Z",
                    "updatedAt": "2025-05-11T17:07:05.098Z"
                }
                """.data(using: .utf8)!
                
                result += "测试数据:\n\(String(data: testCommentData, encoding: .utf8)!)\n\n"
                
                // 尝试使用正确的解码器解析
                result += "使用 JSONDecoder.apiDecoder 解析:\n"
                do {
                    let comment = try JSONDecoder.apiDecoder.decode(Comment.self, from: testCommentData)
                    result += "✓ 成功解析评论!\n"
                    result += "ID: \(comment.id)\n"
                    result += "内容: \(comment.text)\n"
                    result += "创建时间: \(comment.createdAt)\n"
                } catch {
                    result += "❌ 解析失败: \(error)\n"
                    
                    // 详细错误信息
                    if let decodingError = error as? DecodingError {
                        result += "\n详细错误:\n"
                        switch decodingError {
                        case .typeMismatch(let type, let context):
                            result += "类型不匹配: 期望 \(type)\n"
                            result += "路径: \(context.codingPath)\n"
                            result += "描述: \(context.debugDescription)\n"
                        case .dataCorrupted(let context):
                            result += "数据损坏:\n"
                            result += "路径: \(context.codingPath)\n"
                            result += "描述: \(context.debugDescription)\n"
                        default:
                            result += "其他错误: \(decodingError)\n"
                        }
                    }
                }
                
            } catch {
                result += "错误: \(error)\n"
            }
            isLoading = false
        }
    }
}

#Preview {
    CommentParsingDebug()
}
