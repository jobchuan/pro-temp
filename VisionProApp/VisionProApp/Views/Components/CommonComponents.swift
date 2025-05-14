//
//  CommonComponents.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
//
// Views/Components/CommonComponents.swift
import SwiftUI



// MARK: - Content Card
/*struct ContentCard: View {
    let content: Content
    
    var body: some View {
        HStack(spacing: 16) {
            // 缩略图
            if let thumbnailURL = content.files.thumbnail?.url {
                AsyncImage(url: URL(string: thumbnailURL)) { image in
                    image.resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                }
                .frame(width: 120, height: 80)
                .cornerRadius(8)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                // 标题
                Text(content.localizedTitle)
                    .font(.headline)
                    .lineLimit(2)
                
                // 创作者
                Text("by \(content.creatorId.username)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                // 统计信息
                HStack {
                    Label("\(content.stats.views)", systemImage: "eye")
                    Label("\(content.stats.likes)", systemImage: "heart")
                    
                    Spacer()
                    
                    // 价格
                    if content.pricing.isFree {
                        Text("免费")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.green.opacity(0.1))
                            .foregroundColor(.green)
                            .cornerRadius(4)
                    } else {
                        Text(content.formattedPrice)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.1))
                            .foregroundColor(.blue)
                            .cornerRadius(4)
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// 注意：移除了FilterChip定义，因为它已经在其他地方定义
*/
