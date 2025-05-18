// src/utils/pathUtils.js

/**
 * 路径工具函数
 * 
 * 这个模块包含用于统一处理项目中路径的工具函数，
 * 可以避免导入路径错误
 */

/**
 * 获取正确的组件路径
 * @param {string} componentName - 组件名称
 * @param {string} category - 组件类别 (common, layout, etc.)
 * @returns {string} - 组件的相对路径
 */
export const getComponentPath = (componentName, category) => {
  return `@components/${category}/${componentName}`;
};

/**
 * 获取正确的页面路径
 * @param {string} pageName - 页面名称
 * @param {string} section - 页面所属部分 (dashboard, content, etc.)
 * @returns {string} - 页面的相对路径
 */
export const getPagePath = (pageName, section) => {
  return `@pages/${section}/${pageName}`;
};

/**
 * 获取正确的服务路径
 * @param {string} serviceName - 服务名称
 * @param {string} type - 服务类型 (api, http, etc.)
 * @returns {string} - 服务的相对路径
 */
export const getServicePath = (serviceName, type) => {
  return `@services/${type}/${serviceName}`;
};

/**
 * 获取正确的工具路径
 * @param {string} utilName - 工具名称
 * @returns {string} - 工具的相对路径
 */
export const getUtilPath = (utilName) => {
  return `@utils/${utilName}`;
};

/**
 * 获取正确的Hook路径
 * @param {string} hookName - Hook名称
 * @returns {string} - Hook的相对路径
 */
export const getHookPath = (hookName) => {
  return `@hooks/${hookName}`;
};

/**
 * 获取正确的样式路径
 * @param {string} styleName - 样式文件名称
 * @param {string} [component] - 组件名称（可选）
 * @returns {string} - 样式文件的相对路径
 */
export const getStylePath = (styleName, component) => {
  if (component) {
    return `./${styleName}`;
  }
  return `@styles/${styleName}`;
};

/**
 * 获取常量路径
 * @param {string} constantName - 常量文件名称
 * @returns {string} - 常量文件的相对路径
 */
export const getConstantPath = (constantName) => {
  return `@constants/${constantName}`;
};

/**
 * 路径映射，用于修复错误的导入路径
 */
export const PATH_MAPPINGS = {
  // 常见错误路径映射
  './http/client': '../http/client',
  './components/common/App': '../App',
  './pages/login/LoginPage': '../../pages/login/LoginPage',
  './pages/error/NotFoundPage': '../../pages/error/NotFoundPage',
  './components/common/ErrorBoundary': './ErrorBoundary',
  './hooks/useUser': '../../hooks/useUser',
};

/**
 * 修复错误的导入路径
 * @param {string} importPath - 导入路径 
 * @param {string} currentFile - 当前文件路径
 * @returns {string} - 修复后的导入路径
 */
export const fixImportPath = (importPath, currentFile) => {
  // 检查是否在映射中
  if (PATH_MAPPINGS[importPath]) {
    return PATH_MAPPINGS[importPath];
  }
  
  // 更复杂的路径修复逻辑可以在这里添加
  
  return importPath;
};
