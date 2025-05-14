//
//  PhotoViewerVie.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Views/Player/PhotoViewerView.swift
import SwiftUI

struct PhotoViewerView: View {
    let content: Content
    @Environment(\.dismiss) private var dismiss
    @GestureState private var magnification: CGFloat = 1.0
    @State private var steadyStateMagnification: CGFloat = 1.0
    @GestureState private var dragOffset: CGSize = .zero
    @State private var steadyStateDragOffset: CGSize = .zero
    
    var body: some View {
        ZStack {
            // 背景
            Color.black.ignoresSafeArea()
            
            // 照片
            AsyncImage(url: URL(string: content.files.main.url)) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .scaleEffect(magnification * steadyStateMagnification)
                        .offset(x: dragOffset.width + steadyStateDragOffset.width,
                               y: dragOffset.height + steadyStateDragOffset.height)
                        .gesture(
                            MagnificationGesture()
                                .updating($magnification) { currentState, gestureState, _ in
                                    gestureState = currentState
                                }
                                .onEnded { finalValue in
                                    steadyStateMagnification *= finalValue
                                    // 限制缩放范围
                                    steadyStateMagnification = min(max(steadyStateMagnification, 0.5), 5.0)
                                }
                        )
                        .simultaneousGesture(
                            DragGesture()
                                .updating($dragOffset) { value, state, _ in
                                    state = value.translation
                                }
                                .onEnded { value in
                                    steadyStateDragOffset.width += value.translation.width
                                    steadyStateDragOffset.height += value.translation.height
                                }
                        )
                        .gesture(
                            TapGesture(count: 2)
                                .onEnded {
                                    withAnimation {
                                        if steadyStateMagnification > 1 {
                                            steadyStateMagnification = 1
                                            steadyStateDragOffset = .zero
                                        } else {
                                            steadyStateMagnification = 2
                                        }
                                    }
                                }
                        )
                case .failure(_):
                    Image(systemName: "photo")
                        .font(.system(size: 100))
                        .foregroundColor(.gray)
                case .empty:
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.5)
                @unknown default:
                    EmptyView()
                }
            }
            
            // 顶部控制栏
            VStack {
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding()
                            .background(Circle().fill(Color.black.opacity(0.5)))
                    }
                    
                    Spacer()
                    
                    Text(content.localizedTitle)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    // 更多选项按钮
                    Menu {
                        Button {
                            // TODO: 实现下载功能
                        } label: {
                            Label("下载", systemImage: "arrow.down.circle")
                        }
                        
                        Button {
                            // TODO: 实现分享功能
                        } label: {
                            Label("分享", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Image(systemName: "ellipsis")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding()
                            .background(Circle().fill(Color.black.opacity(0.5)))
                    }
                }
                .padding()
                
                Spacer()
            }
        }
    }
}
