// src/services/api/incomeService.js
import { BaseApiService } from './base'

class IncomeApiService extends BaseApiService {
  /**
   * 获取收入概览
   * @param {object} params - 请求参数
   * @returns {Promise<object>} - 收入概览数据
   */
  async getIncomeOverview(params) {
    return this.get('/creator/income/overview', params)
  }

  /**
   * 获取收入明细
   * @param {object} params - 请求参数
   * @returns {Promise<object>} - 收入明细数据
   */
  async getIncomeDetails(params) {
    return this.get('/creator/income/details', params)
  }

  /**
   * 获取收入明细列表
   * @param {object} params - 请求参数
   * @returns {Promise<object>} - 收入明细列表数据
   */
  async getIncomeDetailsList(params) {
    return this.get('/creator/income/list', params)
  }

  /**
   * 获取账户余额
   * @returns {Promise<object>} - 账户余额数据
   */
  async getAccountBalance() {
    return this.get('/creator/income/balance')
  }

  /**
   * 获取提现记录
   * @param {object} params - 请求参数
   * @returns {Promise<object>} - 提现记录数据
   */
  async getWithdrawalHistory(params) {
    return this.get('/creator/income/withdrawals', params)
  }

  /**
   * 提交提现申请
   * @param {object} data - 提现申请数据
   * @returns {Promise<object>} - 提现申请结果
   */
  async submitWithdrawalRequest(data) {
    return this.post('/creator/income/withdraw', data)
  }
  
  /**
   * 导出收入明细
   * @param {object} params - 导出参数
   * @returns {Promise<Blob>} - 导出文件
   */
  async exportIncomeDetails(params) {
    return this.get('/creator/income/export', params, {
      responseType: 'blob'
    })
  }
  
  /**
   * 获取收入趋势
   * @param {object} params - 请求参数
   * @returns {Promise<object>} - 收入趋势数据
   */
  async getIncomeTrends(params) {
    return this.get('/creator/income/trends', params)
  }
  
  /**
   * 获取热门内容收入
   * @param {object} params - 请求参数
   * @returns {Promise<object>} - 热门内容收入数据
   */
  async getTopContentIncome(params) {
    return this.get('/creator/income/top-contents', params)
  }
}

export const incomeApiService = new IncomeApiService()
