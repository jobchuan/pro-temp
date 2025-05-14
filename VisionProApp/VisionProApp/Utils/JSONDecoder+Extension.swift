//
//  JSONDecoder+Extension.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Utils/JSONDecoder+Extension.swift
import Foundation

extension JSONDecoder {
    static let apiDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        // 配置更灵活的日期解码策略
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            
            // 如果是 null 值，返回当前日期
            if container.decodeNil() {
                return Date()
            }
            
            // 尝试解码为字符串
            if let dateString = try? container.decode(String.self) {
                // 空字符串返回当前日期
                if dateString.isEmpty {
                    return Date()
                }
                
                // ISO8601格式解析器
                let isoFormatter = ISO8601DateFormatter()
                
                // 尝试完整格式（带小数秒）
                isoFormatter.formatOptions = [
                    .withInternetDateTime,
                    .withFractionalSeconds
                ]
                if let date = isoFormatter.date(from: dateString) {
                    return date
                }
                
                // 尝试不带小数秒的格式
                isoFormatter.formatOptions = [.withInternetDateTime]
                if let date = isoFormatter.date(from: dateString) {
                    return date
                }
                
                // 尝试其他常见格式
                let formatters = [
                    "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ",
                    "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
                    "yyyy-MM-dd'T'HH:mm:ssZ",
                    "yyyy-MM-dd'T'HH:mm:ss",
                    "yyyy-MM-dd HH:mm:ss",
                    "yyyy-MM-dd"
                ]
                
                for format in formatters {
                    let formatter = DateFormatter()
                    formatter.dateFormat = format
                    formatter.locale = Locale(identifier: "en_US_POSIX")
                    formatter.timeZone = TimeZone(secondsFromGMT: 0)
                    
                    if let date = formatter.date(from: dateString) {
                        return date
                    }
                }
                
                // 如果所有格式都失败，打印错误并返回当前日期
                print("无法解析日期字符串: \(dateString)")
                return Date()
            }
            
            // 尝试解码为时间戳（秒）
            if let timeInterval = try? container.decode(Double.self) {
                return Date(timeIntervalSince1970: timeInterval)
            }
            
            // 尝试解码为时间戳（毫秒）
            if let timeInterval = try? container.decode(Int64.self) {
                return Date(timeIntervalSince1970: Double(timeInterval) / 1000.0)
            }
            
            // 如果所有尝试都失败，返回当前日期
            print("无法解析日期值")
            return Date()
        }
        
        return decoder
    }()
}

// 确保日期编码也使用正确的格式
extension JSONEncoder {
    static let apiEncoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        
        // 使用 ISO8601 日期编码策略
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [
            .withInternetDateTime,
            .withFractionalSeconds
        ]
        
        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            let dateString = isoFormatter.string(from: date)
            try container.encode(dateString)
        }
        
        return encoder
    }()
}
