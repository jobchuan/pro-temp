// components/creator/EnhancedIncomeDashboard.jsx
import React, { useState, useEffect } from 'react';
import { creatorApi } from '../../services/apiService';
import { LineChart, PieChart } from './charts';
import EnhancedIncomeCard from './EnhancedIncomeCard';
import EnhancedWithdrawalModal from './EnhancedWithdrawalModal';
import { Tabs, Table, Button, DatePicker, Select, Card, Tag, Tooltip, Spin, Empty, message } from '../ui/common';
import { formatCurrency, formatDate } from '../../utils/formatter';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const EnhancedIncomeDashboard = () => {
  const [incomeData, setIncomeData] = useState(null);
  const [incomeDetails, setIncomeDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState([null, null]);
  const [incomeSource, setIncomeSource] = useState('all');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [taxInfo, setTaxInfo] = useState(null);
  const [detailsFilters, setDetailsFilters] = useState({
    page: 1,
    limit: 10,
    source: 'all',
    startDate: null,
    endDate: null,
    sort: '-createdAt'
  });
  const [detailsPagination, setDetailsPagination] = useState({
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchIncomeData();
  }, []);

  useEffect(() => {
    if (activeTab === 'details') {
      fetchIncomeDetails();
    } else if (activeTab === 'withdrawals') {
      fetchWithdrawHistory();
    } else if (activeTab === 'tax') {
      fetchTaxInfo();
    }
  }, [activeTab, detailsFilters]);

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
      setDetailsPagination(details.data.data.pagination);
    } catch (error) {
      console.error('获取收入数据失败:', error);
      message.error('获取收入数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeDetails = async () => {
    setDetailsLoading(true);
    try {
      const response = await creatorApi.getIncomeDetails(detailsFilters);
      setIncomeDetails(response.data.data.incomes);
      setDetailsPagination(response.data.data.pagination);
    } catch (error) {
      console.error('获取收入明细失败:', error);
      message.error('获取收入明细失败');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchWithdrawHistory = async () => {
    setDetailsLoading(true);
    try {
      const response = await creatorApi.getWithdrawalHistory();
      setWithdrawHistory(response.data.data.withdrawals);
    } catch (error) {
      console.error('获取提现记录失败:', error);
      message.error('获取提现记录失败');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchTaxInfo = async () => {
    setDetailsLoading(true);
    try {
      const response = await creatorApi.getTaxInfo();
      setTaxInfo(response.data.data);
    } catch (error) {
      console.error('获取税务信息失败:', error);
      message.error('获取税务信息失败');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleWithdrawalRequest = async (withdrawalData) => {
    try {
      await creatorApi.requestWithdrawal(withdrawalData);
      setShowWithdrawalModal(false);
      fetchIncomeData(); // 刷新数据
      fetchWithdrawHistory(); // 刷新提现记录
      message.success('提现申请已提交成功');
    } catch (error) {
      console.error('提现申请失败:', error);
      message.error('提现申请失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleDetailsFilterChange = (newFilters) => {
    setDetailsFilters({
      ...detailsFilters,
      ...newFilters,
      page: newFilters.hasOwnProperty('page') ? newFilters.page : 1
    });
  };

  const handlePageChange = (page, pageSize) => {
    setDetailsFilters({
      ...detailsFilters,
      page,
      limit: pageSize
    });
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      handleDetailsFilterChange({
        startDate: dates[0].toISOString().split('T')[0],
        endDate: dates[1].toISOString().split('T')[0]
      });
    } else {
      handleDetailsFilterChange({
        startDate: null,
        endDate: null
      });
    }
  };

  const handleSourceChange = (value) => {
    setIncomeSource(value);
    handleDetailsFilterChange({ source: value });
  };

  const handleExportIncome = async () => {
    try {
      message.loading('正在准备导出数据...', 0);
      
      // 调用导出API
      const response = await creatorApi.exportIncomeData({
        ...detailsFilters,
        format: 'excel'
      });
      
      // 下载文件
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `income-export-${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.destroy();
      message.success('收入数据导出成功');
    } catch (error) {
      message.destroy();
      console.error('导出数据失败:', error);
      message.error('导出数据失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const getSourceText = (source) => {
    const sourceMap = {
      'content_sale': '内容销售',
      'tip': '打赏',
      'subscription_share': '订阅分成'
    };
    return sourceMap[source] || source;
  };

  const getWithdrawStatusText = (status) => {
    const statusMap = {
      'pending': '处理中',
      'completed': '已完成',
      'rejected': '已拒绝',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  const getWithdrawStatusColor = (status) => {
    const colorMap = {
      'pending': 'blue',
      'completed': 'green',
      'rejected': 'red',
      'cancelled': 'orange'
    };
    return colorMap[status] || 'default';
  };

  if (loading || !incomeData) {
    return <div className="loading-spinner"><Spin size="large" tip="加载收入数据中..." /></div>;
  }

  // 收入详情表格列
  const incomeColumns = [
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date, 'YYYY-MM-DD HH:mm')
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source) => getSourceText(source)
    },
    {
      title: '内容',
      dataIndex: 'contentId',
      key: 'content',
      render: (contentId) => contentId?.title?.['zh-CN'] || contentId?.title?.['en-US'] || '—'
    },
    {
      title: '平台费',
      dataIndex: 'platformFee',
      key: 'platformFee',
      align: 'right',
      render: (fee) => formatCurrency(fee, 'CNY')
    },
    {
      title: '净收入',
      dataIndex: 'netAmount',
      key: 'netAmount',
      align: 'right',
      render: (amount) => formatCurrency(amount, 'CNY')
    },
    {
      title: '状态',
      dataIndex: 'withdrawStatus',
      key: 'status',
      align: 'center',
      render: (status) => {
        let text = '待结算';
        let color = 'default';
        
        if (status === 'pending') {
          text = '待结算';
          color = 'blue';
        } else if (status === 'withdrawable') {
          text = '可提现';
          color = 'green';
        } else if (status === 'processing') {
          text = '提现处理中';
          color = 'orange';
        } else if (status === 'withdrawn') {
          text = '已提现';
          color = 'purple';
        }
        
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  // 提现历史表格列
  const withdrawalColumns = [
    {
      title: '申请日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date, 'YYYY-MM-DD HH:mm')
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => formatCurrency(amount, 'CNY')
    },
    {
      title: '提现方式',
      dataIndex: 'method',
      key: 'method',
      render: (method) => {
        const methodMap = {
          'alipay': '支付宝',
          'wechat': '微信支付',
          'bank': '银行转账'
        };
        return methodMap[method] || method;
      }
    },
    {
      title: '完成日期',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date) => date ? formatDate(date, 'YYYY-MM-DD HH:mm') : '—'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => (
        <Tag color={getWithdrawStatusColor(status)}>
          {getWithdrawStatusText(status)}
        </Tag>
      )
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true
    }
  ];

  return (
    <div className="income-dashboard">
      <div className="dashboard-header">
        <h1>收入管理</h1>
        <Button 
          type="primary"
          onClick={() => setShowWithdrawalModal(true)}
          disabled={incomeData.overview.pending <= 0}
        >
          申请提现
        </Button>
      </div>
      
      <div className="income-stats">
        <EnhancedIncomeCard
          title="可提现金额"
          value={incomeData.overview.pending}
          currency="CNY"
          color="green"
          icon="wallet"
          change={incomeData.overview.pendingChange}
          tooltip="可以立即申请提现的金额"
        />
        <EnhancedIncomeCard
          title="本月收入"
          value={incomeData.overview.thisMonth}
          currency="CNY"
          color="blue"
          icon="calendar"
          change={incomeData.overview.thisMonthChange}
          tooltip="本月累计净收入（与上月相比）"
        />
        <EnhancedIncomeCard
          title="累计总收入"
          value={incomeData.overview.totalLifetime}
          currency="CNY"
          color="purple"
          icon="bar-chart"
          tooltip="平台创作者累计总收入"
        />
      </div>
      
      <Tabs activeKey={activeTab} onChange={handleTabChange} className="income-tabs">
        <TabPane tab="概览" key="overview">
          <div className="income-charts">
            <Card title="收入趋势" className="chart-container">
              <LineChart 
                data={incomeData.trends}
                xKey="month"
                yKey="income"
                color="#00C853"
              />
            </Card>
            
            <Card title="收入来源分布" className="chart-container">
              <PieChart 
                data={incomeData.bySource.map(source => ({
                  name: getSourceText(source._id),
                  value: source.netAmount
                }))}
                dataKey="value"
                nameKey="name"
                colors={['#4C6FFF', '#00C853', '#FF6B00', '#7B61FF']}
              />
            </Card>
          </div>
          
          <Card title="最近交易" extra={
            <Button type="link" onClick={() => setActiveTab('details')}>查看全部</Button>
          }>
            <Table 
              dataSource={incomeDetails.slice(0, 5)} 
              columns={incomeColumns}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        </TabPane>
        
        <TabPane tab="收入明细" key="details">
          <div className="table-filters">
            <div className="filter-item">
              <span className="filter-label">日期范围:</span>
              <RangePicker 
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </div>
            
            <div className="filter-item">
              <span className="filter-label">收入来源:</span>
              <Select 
                value={incomeSource} 
                onChange={handleSourceChange}
                style={{ width: 150 }}
              >
                <Select.Option value="all">全部来源</Select.Option>
                <Select.Option value="content_sale">内容销售</Select.Option>
                <Select.Option value="tip">打赏</Select.Option>
                <Select.Option value="subscription_share">订阅分成</Select.Option>
              </Select>
            </div>
            
            <div className="filter-actions">
              <Button icon="download" onClick={handleExportIncome}>导出数据</Button>
            </div>
          </div>
          
          <Table 
            dataSource={incomeDetails} 
            columns={incomeColumns}
            rowKey="_id"
            loading={detailsLoading}
            pagination={{
              current: detailsFilters.page,
              pageSize: detailsFilters.limit,
              total: detailsPagination.total,
              onChange: handlePageChange,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条记录`
            }}
          />
        </TabPane>
        
        <TabPane tab="提现记录" key="withdrawals">
          <Table 
            dataSource={withdrawHistory} 
            columns={withdrawalColumns}
            rowKey="_id"
            loading={detailsLoading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条记录`
            }}
          />
        </TabPane>
        
        <TabPane tab="税务信息" key="tax">
          {detailsLoading ? (
            <div className="loading-spinner"><Spin tip="加载税务信息..." /></div>
          ) : taxInfo ? (
            <div className="tax-info-container">
              <Card title="税务预览" className="tax-summary-card">
                <div className="tax-summary">
                  <div className="tax-item">
                    <span className="tax-label">本年应税收入:</span>
                    <span className="tax-value">{formatCurrency(taxInfo.yearIncome, 'CNY')}</span>
                  </div>
                  <div className="tax-item">
                    <span className="tax-label">预计税额:</span>
                    <span className="tax-value">{formatCurrency(taxInfo.estimatedTax, 'CNY')}</span>
                  </div>
                  <div className="tax-item">
                    <span className="tax-label">适用税率:</span>
                    <span className="tax-value">{(taxInfo.taxRate * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </Card>
              
              <Card title="税务信息" className="tax-details-card">
                <div className="tax-details">
                  <div className="tax-detail-item">
                    <span className="detail-label">纳税人识别号:</span>
                    <span className="detail-value">{taxInfo.taxId || '未设置'}</span>
                  </div>
                  <div className="tax-detail-item">
                    <span className="detail-label">纳税人类型:</span>
                    <span className="detail-value">{
                      taxInfo.taxpayerType === 'individual' ? '个人' :
                      taxInfo.taxpayerType === 'company' ? '企业' : 
                      '未设置'
                    }</span>
                  </div>
                  <div className="tax-detail-item">
                    <span className="detail-label">纳税地址:</span>
                    <span className="detail-value">{taxInfo.address || '未设置'}</span>
                  </div>
                  <div className="tax-detail-item">
                    <span className="detail-label">企业名称:</span>
                    <span className="detail-value">{taxInfo.companyName || '不适用'}</span>
                  </div>
                </div>
                
                <div className="tax-actions">
                  <Button type="primary" onClick={() => navigate('/creator/settings')}>
                    更新税务信息
                  </Button>
                  <Button onClick={() => window.open('/tax-guide.pdf', '_blank')}>
                    查看税务指南
                  </Button>
                </div>
              </Card>
              
              <Card title="税务通知" className="tax-notices-card">
                <div className="tax-notices">
                  {taxInfo.notices && taxInfo.notices.length > 0 ? (
                    <ul className="notice-list">
                      {taxInfo.notices.map((notice, index) => (
                        <li key={index} className="notice-item">
                          <div className="notice-date">{formatDate(notice.date)}</div>
                          <div className="notice-content">{notice.content}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty description="暂无税务通知" />
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Empty 
              description="税务信息尚未设置" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/creator/settings')}>
                设置税务信息
              </Button>
            </Empty>
          )}
        </TabPane>
      </Tabs>
      
      {showWithdrawalModal && (
        <EnhancedWithdrawalModal
          availableAmount={incomeData.overview.pending}
          onRequestWithdrawal={handleWithdrawalRequest}
          onClose={() => setShowWithdrawalModal(false)}
        />
      )}
    </div>
  );
};

export default EnhancedIncomeDashboard;