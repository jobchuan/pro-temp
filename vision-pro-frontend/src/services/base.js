// src/services/base.js

/**
 * 修复 ../http/client 导入错误
 * 
 * 这个文件是为了解决 src/services/base.js 中的导入错误创建的
 * 实际上，base.js 应该在 src/services/api/base.js 路径下
 * 并且应该导入 ../http/client
 * 
 * 这个文件提供了一个简单的重定向，将从该文件的导入重定向到正确的位置
 */

import httpClient from './http/client'
import { BaseApiService } from './api/base'

export { BaseApiService }
export default httpClient
