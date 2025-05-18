// src/pages/income/WithdrawalPage.jsx
import React, { useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  InputNumber, 
  Steps, 
  Result, 
  Divider, 
  Table, 
  Tag, 
  Space,
  Typography,
  Alert,
  Tabs,
  Spin,
  Modal
} from 'antd'
import { 
  BankOutlined, 
  AlipayOutlined, 
  WechatOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useQuery, useMutation } from 'react-query'
import { incomeApiService } from '@/services/api/incomeService'
import './WithdrawalPage.less'

const { Option } = Select
const { Title, Text, Paragraph } = Typography

const WithdrawalPage = () => {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank')
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [withdrawalData, setWithdrawalData] = useState(null)
  const [activeTab, setActiveTab] = useState('withdraw')
  
  // 获取账户余额
  const { data: balanceData, isLoading: isBalanceLoading } = useQuery(
    'accountBalance',
    () => incomeApiService.getAccountBalance(),
    {
      refetchOnWindowFocus: false
    }
  )
  
  // 获取提现记录
  const { data: withdrawalHistoryData, isLoading: isHistoryLoading } = useQuery(
    'withdrawalHistory',
    () => incomeApiService.getWithdrawalHistory(),
    {
      refetchOnWindowFocus: false,
      enabled: activeTab === 'history'
    }
  )
  
  // 提现申请mutation
  const withdrawalMutation = useMutation(
    (data) => incomeApiService.submitWithdrawalRequest(data),
    {
      onSuccess: (response) => {
        if (response.success) {
          setCurrentStep(2)
        }
      }
    }
  )
  
  // 验证提现金额
  const validateAmount = (_, value) => {
    const balance = balanceData?.data?.availableBalance || 0
    
    if (value <= 0) {
      return Promise.reject('提现金额必须大于0')
    }
    
    if (value > balance) {
      return Promise.reject('提现金额不能大于可用余额')
    }
    
    if (value < 100) {
      return Promise.reject('最低提现金额为100元')
    }
    
    return Promise.resolve()
  }
  
  // 处理提现方式变更
  const handleMethodChange = (value) => {
    setWithdrawalMethod(value)
    form.resetFields(['accountNumber', 'accountName', 'bankName'])
  }
  
  // 处理表单提交
  const handleSubmit = (values) => {
    setWithdrawalData(values)
    setConfirmModalVisible(true)
  }
  
  // 确认提现
  const confirmWithdrawal = () => {
    setConfirmModalVisible(false)
    setCurrentStep(1)
    
    // 调用提现API
    withdrawalMutation.mutate(withdrawalData)
  }
  
  // 重新填写
  const handleReset = () => {
    setCurrentStep(0)
    form.resetFields()
  }
  
  // 渲染提现表单
  const renderWithdrawalForm = () => {
    const balance = balanceData?.data?.availableBalance || 0
    
    return (
      <Card className="withdrawal-card">
        <div className="balance-info">
          <div className="balance-item">
            <div className="balance-label">可提现余额</div>
            <div className="balance-value">¥{balance.toFixed(2)}</div>
          </div>
          <div className="balance-item">
            <div className="balance-label">待结算金额</div>
            <div className="balance-value">¥{(balanceData?.data?.pendingBalance || 0).toFixed(2)}</div>
          </div>
        </div>
        
        <Divider />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              { validator: validateAmount }
            ]}
            extra="单笔提现最低100元，最高50,000元"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入提现金额"
              prefix="¥"
              precision={2}
              min={0}
              max={50000}
            />
          </Form.Item>
          
          <Form.Item
            name="withdrawalMethod"
            label="提现方式"
            rules={[{ required: true, message: '请选择提现方式' }]}
            initialValue="bank"
          >
            <Select onChange={handleMethodChange}>
              <Option value="bank">
                <BankOutlined /> 银行卡
              </Option>
              <Option value="alipay">
                <AlipayOutlined /> 支付宝
              </Option>
              <Option value="wechat">
                <WechatOutlined /> 微信支付
              </Option>
            </Select>
          </Form.Item>
          
          {withdrawalMethod === 'bank' && (
            <>
              <Form.Item
                name="bankName"
                label="银行名称"
                rules={[{ required: true, message: '请输入银行名称' }]}
              >
                <Select placeholder="请选择银行">
                  <Option value="icbc">中国工商银行</Option>
                  <Option value="abc">中国农业银行</Option>
                  <Option value="boc">中国银行</Option>
                  <Option value="ccb">中国建设银行</Option>
                  <Option value="cmb">招商银行</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="accountNumber"
                label="银行卡号"
                rules={[{ required: true, message: '请输入银行卡号' }]}
              >
                <Input placeholder="请输入银行卡号" />
              </Form.Item>
              
              <Form.Item
                name="accountName"
                label="持卡人姓名"
                rules={[{ required: true, message: '请输入持卡人姓名' }]}
              >
                <Input placeholder="请输入持卡人姓名" />
              </Form.Item>
            </>
          )}
          
          {withdrawalMethod === 'alipay' && (
            <>
              <Form.Item
                name="accountNumber"
                label="支付宝账号"
                rules={[{ required: true, message: '请输入支付宝账号' }]}
              >
                <Input placeholder="请输入支付宝账号(手机号或邮箱)" />
              </Form.Item>
              
              <Form.Item
                name="accountName"
                label="支付宝实名"
                rules={[{ required: true, message: '请输入支付宝实名' }]}
              >
                <Input placeholder="请输入支付宝实名" />
              </Form.Item>
            </>
          )}
          
          {withdrawalMethod === 'wechat' && (
            <>
              <Form.Item
                name="accountNumber"
                label="微信账号"
                rules={[{ required: true, message: '请输入微信账号' }]}
              >
                <Input placeholder="请输入微信账号" />
              </Form.Item>
              
              <Form.Item
                name="accountName"
                label="微信实名"
                rules={[{ required: true, message: '请输入微信实名' }]}
              >
                <Input placeholder="请输入微信实名" />
              </Form.Item>
            </>
          )}
          
          <Form.Item
            name="verificationCode"
            label="验证码"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="verification-code-input">
              <Input placeholder="请输入验证码" />
              <Button>获取验证码</Button>
            </div>
          </Form.Item>
          
          <Alert
            message="提现说明"
            description="1. 提现申请将在1-3个工作日内处理；2. 提现手续费为1%，最低1元，最高50元；3. 请确保提现账户信息准确无误，因账户信息错误导致的提现失败，手续费不予退还。"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 24 }}
          />
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              申请提现
            </Button>
          </Form.Item>
        </Form>
      </Card>
    )
  }
  
  // 渲染处理中状态
  const renderProcessing = () => {
    return (
      <Card className="processing-card">
        <Result
          icon={<Spin size="large" />}
          title="提现申请处理中"
          subTitle="请耐心等待，提现申请正在处理中..."
        />
      </Card>
    )
  }
  
  // 渲染成功状态
  const renderSuccess = () => {
    return (
      <Card className="success-card">
        <Result
          status="success"
          title="提现申请已提交成功"
          subTitle={`提现申请已提交，预计1-3个工作日内处理完成。提现金额：¥${withdrawalData?.amount || 0}，手续费：¥${Math.min(50, Math.max(1, withdrawalData?.amount * 0.01)) || 0}。`}
          extra={[
            <Button type="primary" key="dashboard" onClick={() => setActiveTab('history')}>
              查看提现记录
            </Button>,
            <Button key="withdraw" onClick={handleReset}>
              再次提现
            </Button>
          ]}
        />
      </Card>
    )
  }
  
  // 渲染提现历史
  const renderWithdrawalHistory = () => {
    if (isHistoryLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    // 演示数据
    const demoData = [
      {
        key: '1',
        requestId: 'WD202305200001',
        amount: 1000.00,
        fee: 10.00,
        actualAmount: 990.00,
        method: 'bank',
        account: '工商银行 (6222 **** **** 1234)',
        status: 'completed',
        requestTime: '2023-05-20 10:30:00',
        completeTime: '2023-05-22 15:45:22'
      },
      {
        key: '2',
        requestId: 'WD202305120002',
        amount: 500.00,
        fee: 5.00,
        actualAmount: 495.00,
        method: 'alipay',
        account: '支付宝 (186****8888)',
        status: 'completed',
        requestTime: '2023-05-12 14:20:15',
        completeTime: '2023-05-13 09:30:45'
      },
      {
        key: '3',
        requestId: 'WD202306010003',
        amount: 2000.00,
        fee: 20.00,
        actualAmount: 1980.00,
        method: 'bank',
        account: '招商银行 (6225 **** **** 5678)',
        status: 'processing',
        requestTime: '2023-06-01 16:05:30',
        completeTime: null
      }
    ]
    
    const columns = [
      {
        title: '申请编号',
        dataIndex: 'requestId',
        key: 'requestId'
      },
      {
        title: '提现金额',
        dataIndex: 'amount',
        key: 'amount',
        render: (text) => `¥${parseFloat(text).toFixed(2)}`
      },
      {
        title: '手续费',
        dataIndex: 'fee',
        key: 'fee',
        render: (text) => `¥${parseFloat(text).toFixed(2)}`
      },
      {
        title: '实际到账',
        dataIndex: 'actualAmount',
        key: 'actualAmount',
        render: (text) => `¥${parseFloat(text).toFixed(2)}`
      },
      {
        title: '提现方式',
        dataIndex: 'method',
        key: 'method',
        render: (text) => {
          switch (text) {
            case 'bank':
              return <Tag icon={<BankOutlined />}>银行卡</Tag>
            case 'alipay':
              return <Tag icon={<AlipayOutlined />} color="blue">支付宝</Tag>
            case 'wechat':
              return <Tag icon={<WechatOutlined />} color="green">微信</Tag>
            default:
              return text
          }
        }
      },
      {
        title: '收款账户',
        dataIndex: 'account',
        key: 'account'
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (text) => {
          switch (text) {
            case 'completed':
              return <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
            case 'processing':
              return <Tag color="processing">处理中</Tag>
            case 'failed':
              return <Tag color="error" icon={<WarningOutlined />}>失败</Tag>
            default:
              return text
          }
        }
      },
      {
        title: '申请时间',
        dataIndex: 'requestTime',
        key: 'requestTime'
      },
      {
        title: '完成时间',
        dataIndex: 'completeTime',
        key: 'completeTime',
        render: (text) => text || '-'
      }
    ]
    
    return (
      <Card title="提现记录" className="history-card">
        <Table
          columns={columns}
          dataSource={demoData}
          rowKey="requestId"
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true
          }}
        />
      </Card>
    )
  }
  
  // 渲染当前步骤
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWithdrawalForm()
      case 1:
        return renderProcessing()
      case 2:
        return renderSuccess()
      default:
        return renderWithdrawalForm()
    }
  }
  
  return (
    <div className="withdrawal-page">
      <div className="page-header">
        <h1>提现管理</h1>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'withdraw',
            label: (
              <span>
                <BankOutlined /> 申请提现
              </span>
            ),
            children: (
              <div className="withdrawal-container">
                <Steps
                  current={currentStep}
                  className="withdrawal-steps"
                  items={[
                    {
                      title: '填写提现信息',
                      description: '输入提现金额和账户'
                    },
                    {
                      title: '处理中',
                      description: '请耐心等待'
                    },
                    {
                      title: '提现成功',
                      description: '提现申请已提交'
                    }
                  ]}
                />
                {renderCurrentStep()}
              </div>
            )
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> 提现记录
              </span>
            ),
            children: renderWithdrawalHistory()
          }
        ]}
      />
      
      {/* 确认提现模态框 */}
      <Modal
        title="确认提现申请"
        open={confirmModalVisible}
        onOk={confirmWithdrawal}
        onCancel={() => setConfirmModalVisible(false)}
        okText="确认提现"
        cancelText="取消"
      >
        <div className="confirm-content">
          <Paragraph>
            请确认以下提现信息：
          </Paragraph>
          <div className="confirm-item">
            <Text>提现金额：</Text>
            <Text strong>¥{withdrawalData?.amount}</Text>
          </div>
          <div className="confirm-item">
            <Text>手续费：</Text>
            <Text strong>¥{Math.min(50, Math.max(1, withdrawalData?.amount * 0.01)) || 0}</Text>
          </div>
          <div className="confirm-item">
            <Text>实际到账：</Text>
            <Text strong>¥{(withdrawalData?.amount - Math.min(50, Math.max(1, withdrawalData?.amount * 0.01))) || 0}</Text>
          </div>
          <div className="confirm-item">
            <Text>提现方式：</Text>
            <Text strong>
              {withdrawalMethod === 'bank' && '银行卡'}
              {withdrawalMethod === 'alipay' && '支付宝'}
              {withdrawalMethod === 'wechat' && '微信支付'}
            </Text>
          </div>
          <div className="confirm-item">
            <Text>收款账户：</Text>
            <Text strong>
              {withdrawalMethod === 'bank' && `${withdrawalData?.bankName} ${withdrawalData?.accountNumber}`}
              {withdrawalMethod === 'alipay' && `支付宝 ${withdrawalData?.accountNumber}`}
              {withdrawalMethod === 'wechat' && `微信 ${withdrawalData?.accountNumber}`}
            </Text>
          </div>
          <Alert
            message="提现申请确认后将无法撤销，请确保信息正确。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default WithdrawalPage