// src/types/index.js

/**
 * API响应类型
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 请求是否成功
 * @property {any} data - 响应数据
 * @property {string} [message] - 响应消息
 * @property {string} [error] - 错误代码
 */

/**
 * 分页数据类型
 * @typedef {Object} PaginationData
 * @property {number} total - 总记录数
 * @property {number} page - 当前页码
 * @property {number} pages - 总页数
 * @property {number} limit - 每页记录数
 */

/**
 * 内容状态枚举
 * @typedef {'draft'|'pending_review'|'approved'|'published'|'rejected'|'archived'} ContentStatus
 */

/**
 * 内容类型枚举
 * @typedef {'180_video'|'360_video'|'180_photo'|'360_photo'|'spatial_video'|'spatial_photo'} ContentType
 */
