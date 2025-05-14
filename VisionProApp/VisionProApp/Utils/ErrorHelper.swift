//
//  ErrorHelper.swift
//  VisionProApp
//
//  Created by 五行 on 2025/5/11.
//
// Utils/ErrorHelper.swift
import Foundation

struct ErrorHelper {
    static func parseLoginError(_ error: Error) -> String {
        // 打印原始错误用于调试
        print("原始登录错误: \(error)")
        
        if let apiError = error as? APIError {
            switch apiError {
            case .serverError(let message):
                // 尝试解析具体的错误类型
                let lowercasedMessage = message.lowercased()
                
                // 如果服务器返回的是模糊的错误消息（安全考虑），保持原样
                if message == "邮箱或密码错误" || lowercasedMessage == "invalid email or password" {
                    return "邮箱或密码错误，请检查后重试"
                }
                
                // 其他更具体的错误消息
                if lowercasedMessage.contains("password") || message.contains("密码") {
                    return "密码错误，请检查后重试"
                } else if lowercasedMessage.contains("email") || lowercasedMessage.contains("user") ||
                         message.contains("邮箱") || message.contains("用户") || message.contains("不存在") {
                    return "该邮箱未注册，请先注册账号"
                } else if message.contains("登录失败") {
                    return "登录失败，请稍后重试"
                } else {
                    return message
                }
            default:
                return apiError.localizedDescription
            }
        } else if let networkError = error as? NetworkError {
            switch networkError {
            case .authenticationFailed(let message):
                // 同样的解析逻辑
                let lowercasedMessage = message.lowercased()
                
                // 如果服务器返回的是模糊的错误消息（安全考虑），保持原样
                if message == "邮箱或密码错误" || lowercasedMessage == "invalid email or password" {
                    return "邮箱或密码错误，请检查后重试"
                }
                
                if lowercasedMessage.contains("password") || message.contains("密码") {
                    return "密码错误，请检查后重试"
                } else if lowercasedMessage.contains("email") || lowercasedMessage.contains("user") ||
                         message.contains("邮箱") || message.contains("用户") || message.contains("不存在") {
                    return "该邮箱未注册，请先注册账号"
                } else {
                    return message
                }
            case .badRequest(let message):
                return message
            case .networkError:
                return "网络连接失败，请检查网络后重试"
            case .unauthorized:
                return "登录已过期，请重新登录"
            default:
                return networkError.localizedDescription
            }
        }
        
        return error.localizedDescription
    }
    
    static func parseRegisterError(_ error: Error) -> String {
        // 打印原始错误用于调试
        print("原始注册错误: \(error)")
        
        if let apiError = error as? APIError {
            switch apiError {
            case .serverError(let message):
                // 尝试解析具体的错误类型
                let lowercasedMessage = message.lowercased()
                if lowercasedMessage.contains("username") || message.contains("用户名") {
                    return "该用户名已被使用，请换一个"
                } else if lowercasedMessage.contains("email") || message.contains("邮箱") {
                    return "该邮箱已注册，请直接登录"
                } else if message.contains("已存在") || message.contains("已被使用") {
                    return "用户名或邮箱已存在"
                } else {
                    return message
                }
            default:
                return apiError.localizedDescription
            }
        } else if let networkError = error as? NetworkError {
            switch networkError {
            case .networkError:
                return "网络连接失败，请检查网络后重试"
            default:
                return networkError.localizedDescription
            }
        }
        
        return error.localizedDescription
    }
}
