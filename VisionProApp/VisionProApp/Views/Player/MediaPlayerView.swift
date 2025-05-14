//
//  MediaPlayerView.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Player/MediaPlayerView.swift
import SwiftUI

struct MediaPlayerView: View {
    let content: Content
    
    var body: some View {
        Group {
            switch content.contentType {
            case .video180:
                Video180PlayerView(content: content)
            case .video360:
                Video360PlayerView(content: content)
            case .spatialVideo:
                SpatialVideoPlayerView(content: content)
            case .photo180, .photo360, .spatialPhoto:
                PhotoViewerView(content: content)
            }
        }
    }
}

// 播放器底部信息栏组件
struct PlayerBottomSheet: View {
    let content: Content
    @Binding var isExpanded: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // 拖动指示器
            HStack {
                Spacer()
                RoundedRectangle(cornerRadius: 2.5)
                    .fill(Color.gray.opacity(0.5))
                    .frame(width: 40, height: 5)
                Spacer()
            }
            .onTapGesture {
                withAnimation {
                    isExpanded.toggle()
                }
            }
            
            // 内容信息
            VStack(alignment: .leading, spacing: 8) {
                Text(content.localizedTitle)
                    .font(.title2)
                    .fontWeight(.bold)
                
                if !content.localizedDescription.isEmpty {
                    Text(content.localizedDescription)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .lineLimit(isExpanded ? nil : 2)
                }
                
                // 标签
                if let tags = content.tags, !tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(tags, id: \.self) { tag in
                                Text("#\(tag)")
                                    .font(.caption)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.blue.opacity(0.1))
                                    .cornerRadius(8)
                            }
                        }
                    }
                }
                
                // 统计信息
                HStack(spacing: 20) {
                    Label("\(content.stats.views)", systemImage: "eye")
                    Label("\(content.stats.likes)", systemImage: "heart")
                    Label("\(content.stats.shares)", systemImage: "square.and.arrow.up")
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(20, corners: [.topLeft, .topRight])
    }
}

// 自定义圆角扩展
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
