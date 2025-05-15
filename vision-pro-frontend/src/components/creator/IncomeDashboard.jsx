// components/creator/IncomeDashboard.jsx
import React, { useState, useEffect } from 'react';
import { creatorApi } from '../../services/apiService';
import { LineChart, PieChart } from './charts';
import IncomeCard from './IncomeCard';
import WithdrawalModal from './WithdrawalModal';

const IncomeDashboard = () => {
  const [incomeData, setIncomeData] = useState(null);
  const [incomeDetails, setIncomeDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    setLoading(true);
    try {
      const overview = await creatorApi.getIncomeOverview();
      setIncomeData(overview.data.data);
      
      const details = await creatorApi.getIncomeDetails({ 
        limit: 5, 
        sort: '-createdAt' 
      });
      setIncomeDetails(details.data.data.incomes);
    } catch (error) {
      console.error('获取收入数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalRequest = async (withdrawalData) => {
    try {
      await creatorApi.requestWithdrawal(withdrawalData);
      setShowWithdrawalModal(false);
      fetchIncomeData(); // 刷新数据
    } catch (error) {
      console.error('提现申请失败:', error);
      // 显示错误信息
    }
  };

  if (loading || !incomeData) {
    return <div className="loading-spinner">加载收入数据中...</div>;
  }

  return (
    <div className="income-dashboard">
      <div className="dashboard-header">
        <h1>收入管理</h1>
        <button 
          className="primary-button"
          onClick={() => setShowWithdrawalModal(true)}
          disabled={incomeData.overview.pending <= 0}
        >
          申请提现
        </button>
      </div>
      
      <div className="income-stats">
        <IncomeCard
          title="可提现金额"
          value={incomeData.overview.pending}
          currency="CNY"
          color="green"
        />
        <IncomeCard
          title="本月收入"
          value={incomeData.overview.thisMonth}
          currency="CNY"
          color="blue"
        />
        <IncomeCard
          title="累计总收入"
          value={incomeData.overview.totalLifetime}
          currency="CNY"
          color="purple"
        />
      </div>
      
      <div className="income-charts">
        <div className="chart-container">
          <h2>收入趋势</h2>
          <LineChart 
            data={incomeData.trends}
            xKey="month"
            yKey="income"
            color="#00C853"
          />
        </div>
        
        <div className="chart-container">
          <h2>收入来源分布</h2>
          <PieChart 
            data={incomeData.bySource.map(source => ({
              name: source._id === 'content_sale' ? '内容销售' : 
                   source._id === 'tip' ? '打赏' : 
                   source._id === 'subscription_share' ? '订阅分成' : source._id,
              value: source.netAmount
            }))}
            dataKey="value"
            nameKey="name"
            colors={['#4C6FFF', '#00C853', '#FF6B00', '#7B61FF']}
          />
        </div>
      </div>
      
      <div className="recent-transactions">
        <h2>最近交易</h2>
        <table className="income-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>来源</th>
              <th>内容</th>
              <th>金额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {incomeDetails.map(income => (
              <tr key={income._id}>
                <td>{new Date(income.createdAt).toLocaleDateString()}</td>
                <td>{income.source === 'content_sale' ? '内容销售' : 
                     income.source === 'tip' ? '打赏' : 
                     income.source === 'subscription_share' ? '订阅分成' : income.source}</td>
                <td>{income.contentId?.title?.['zh-CN'] || '—'}</td>
                <td>¥{income.netAmount.toFixed(2)}</td>
                <td>{income.withdrawStatus === 'pending' ? '待结算' :
                     income.withdrawStatus === 'withdrawable' ? '可提现' :
                     income.withdrawStatus === 'processing' ? '提现处理中' :
                     income.withdrawStatus === 'withdrawn' ? '已提现' : income.withdrawStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showWithdrawalModal && (
        <WithdrawalModal
          availableAmount={incomeData.overview.pending}
          onRequestWithdrawal={handleWithdrawalRequest}
          onClose={() => setShowWithdrawalModal(false)}
        />
      )}
    </div>
  );
};

export default IncomeDashboard;