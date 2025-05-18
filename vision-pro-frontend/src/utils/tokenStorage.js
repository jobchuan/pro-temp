// src/utils/tokenStorage.js
/**
 * 获取访问令牌
 * @returns {string|null} - 访问令牌
 */
export const getToken = () => {
  return localStorage.getItem('token')
}

/**
 * 设置访问令牌
 * @param {string} token - 访问令牌
 */
export const setToken = (token) => {
  localStorage.setItem('token', token)
}

/**
 * 获取刷新令牌
 * @returns {string|null} - 刷新令牌
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken')
}

/**
 * 设置刷新令牌
 * @param {string} refreshToken - 刷新令牌
 */
export const setRefreshToken = (refreshToken) => {
  localStorage.setItem('refreshToken', refreshToken)
}

/**
 * 清除所有令牌
 */
export const clearTokens = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
}
