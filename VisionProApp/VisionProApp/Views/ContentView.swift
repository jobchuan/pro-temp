//
//  ContentView.swift
//  immersivechina
//
//  Created by 五行 on 2025/5/11.
//
// Views/ContentView.swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(systemName: "visionpro")
                    .imageScale(.large)
                    .foregroundStyle(.tint)
                    .font(.system(size: 60))
                
                Text("Vision Pro App")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("VR内容平台")
                    .font(.title2)
                    .foregroundColor(.secondary)
                
                Divider()
                    .padding(.vertical)
                
                VStack(spacing: 15) {
                    NavigationLink("测试评论功能") {
                        CommentParsingDebug()
                    }
                    NavigationLink("调试评论API") {
                        CommentStructureDebug()
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.purple)
                    .buttonStyle(.bordered)
                    .foregroundColor(.green)
                    NavigationLink("简单网络测试") {
                       SimpleNetworkTest()
                    }
                   .buttonStyle(.borderedProminent)
                   .foregroundColor(.red)
                
                    
                    NavigationLink("登录错误调试") {
                        SimpleLoginTest()
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.orange)
                    
                    NavigationLink("测试内容功能") {
                        ContentTestView()
                    }
                    .buttonStyle(.borderedProminent)
                    .foregroundColor(.purple)
                    
                    NavigationLink("查看内容列表") {
                        ContentListView()
                    }
                    .buttonStyle(.bordered)
                    
                }
            }
            .padding()
            .navigationTitle("主页")
        }
    }
}

#Preview {
    ContentView()
}
