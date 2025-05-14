//
//  ViewHistoryExtensions.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Extensions/ViewHistoryExtensions.swift
import Foundation

extension ViewHistory {
    static func getHistory(for contentId: String) async throws -> ViewHistory? {
        let service = InteractionService()
        let history = try await service.getViewHistory()
        return history.first { $0.contentId == contentId }
    }
}
