// utils/fileUtils.js

/**
 * 为文件生成唯一标识符（用于断点续传）
 * @param {File} file - 文件对象
 * @returns {string} 唯一标识符
 */
export const generateFileIdentifier = (file) => {
  const relativePath = file.webkitRelativePath || file.name;
  const fileInfo = [file.name, file.size, file.type, relativePath].join('-');
  // 使用简单哈希函数，实际项目中可以使用更强的哈希算法
  let hash = 0;
  for (let i = 0; i < fileInfo.length; i++) {
    hash = ((hash << 5) - hash) + fileInfo.charCodeAt(i);
    hash |= 0; // 转换为32位整数
  }
  return `${hash}_${Date.now()}`;
};

/**
 * 将文件分割成多个块
 * @param {File} file - 文件对象
 * @param {number} chunkSize - 每个块的大小（字节）
 * @returns {Array} 文件块数组
 */
export const sliceFile = (file, chunkSize = 2 * 1024 * 1024) => { // 默认2MB一块
  const chunks = [];
  let start = 0;
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    chunks.push(chunk);
    start = end;
  }
  
  return chunks;
};

/**
 * 存储上传状态到本地存储
 * @param {string} identifier - 文件标识符
 * @param {Object} state - 上传状态
 */
export const saveUploadState = (identifier, state) => {
  try {
    localStorage.setItem(`upload_${identifier}`, JSON.stringify(state));
  } catch (error) {
    console.error('保存上传状态失败:', error);
  }
};

/**
 * 从本地存储获取上传状态
 * @param {string} identifier - 文件标识符
 * @returns {Object|null} 上传状态
 */
export const getUploadState = (identifier) => {
  try {
    const state = localStorage.getItem(`upload_${identifier}`);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('获取上传状态失败:', error);
    return null;
  }
};

/**
 * 清除本地存储中的上传状态
 * @param {string} identifier - 文件标识符
 */
export const clearUploadState = (identifier) => {
  try {
    localStorage.removeItem(`upload_${identifier}`);
  } catch (error) {
    console.error('清除上传状态失败:', error);
  }
};

/**
 * 获取文件类型分类
 * @param {string} mimeType - 文件的MIME类型
 * @returns {string} 文件类型分类
 */
export const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'document';
  return 'other';
};