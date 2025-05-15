// 配置对象
const config = {
    apiBaseUrl: 'http://localhost:5001/api', // 根据实际后端API地址修改
    defaultPageSize: 10
};

// 全局变量
let token = localStorage.getItem('adminToken');
let currentSection = 'dashboard';
let testMode = false; // 测试模式标志

/**
 * 显示加载状态
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.id = `${elementId}-loader`;
        
        // 清除已有内容
        if (element.querySelector(`#${elementId}-loader`)) {
            return; // 已存在加载器，不再重复添加
        }
        
        element.appendChild(loader);
    }
}

/**
 * 隐藏加载状态
 */
function hideLoading(elementId) {
    const loader = document.getElementById(`${elementId}-loader`);
    if (loader) {
        loader.remove();
    }
}

/**
 * 通用API错误处理
 */
function handleApiError(error, message = '操作失败') {
    console.error(`${message}:`, error);
    alert(`${message}，请检查网络连接和后端服务状态`);
}

/**
 * 封装API请求
 */
async function fetchApi(endpoint, options = {}) {
    try {
        const url = `${config.apiBaseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        // 检查响应状态
        if (!response.ok) {
            if (response.status === 401) {
                // 未授权，可能是token过期
                token = null;
                localStorage.removeItem('adminToken');
                alert('登录已过期，请重新登录');
                showLoginPage();
                throw new Error('登录已过期');
            }
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '请求失败');
        }
        
        return data;
    } catch (error) {
        handleApiError(error, '请求失败');
        throw error;
    }
}

/**
 * 生成模拟数据用于测试
 */
function getMockDashboardData() {
    // 生成过去7天的日期
    const getDates = () => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        }
        return dates;
    };
    
    const dates = getDates();
    
    return {
        success: true,
        data: {
            users: {
                total: 2458
            },
            content: {
                published: 356
            },
            orders: {
                completed: 1289,
                revenue: 68942.50
            },
            last7DaysUsers: dates.map((date, index) => ({
                date,
                count: Math.floor(Math.random() * 50) + 10
            })),
            last7DaysRevenue: dates.map((date, index) => ({
                date,
                amount: Math.floor(Math.random() * 5000) + 1000
            })),
            contentTypeDistribution: [
                { _id: '180_video', count: 120 },
                { _id: '180_photo', count: 85 },
                { _id: '360_video', count: 65 },
                { _id: '360_photo', count: 45 },
                { _id: 'spatial_video', count: 30 },
                { _id: 'spatial_photo', count: 11 }
            ],
            orderTypeDistribution: [
                { _id: 'subscription', amount: 45000 },
                { _id: 'content', amount: 20000 },
                { _id: 'tip', amount: 3942.50 }
            ]
        }
    };
}

/**
 * 生成模拟的待审核内容
 */
function getMockPendingContents() {
    return {
        success: true,
        data: {
            contents: [
                {
                    _id: '60a1b2c3d4e5f6a7b8c9d0e1',
                    title: { 'zh-CN': '示例VR体验1', 'en-US': 'Sample VR Experience 1' },
                    contentType: '180_video',
                    creatorId: { username: '创作者小王' },
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '60a2b3c4d5e6f7a8b9c0d1e2',
                    title: { 'zh-CN': 'AR全景照片', 'en-US': 'AR Panorama Photo' },
                    contentType: '360_photo',
                    creatorId: { username: '创作者小李' },
                    createdAt: new Date(Date.now() - 86400000).toISOString() // 1天前
                },
                {
                    _id: '60a3b4c5d6e7f8a9b0c1d2e3',
                    title: { 'zh-CN': '空间视频示例', 'en-US': 'Spatial Video Sample' },
                    contentType: 'spatial_video',
                    creatorId: { username: '创作者小张' },
                    createdAt: new Date(Date.now() - 172800000).toISOString() // 2天前
                }
            ]
        }
    };
}

/**
 * 初始化页面
 */
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已登录
    if (!token) {
        showLoginPage();
    } else {
        hideLoginPage();
        loadDashboardData(testMode);
    }

    // 登录按钮点击事件
    document.getElementById('login-btn').addEventListener('click', login);

    // 退出按钮点击事件
    document.getElementById('logout-btn').addEventListener('click', logout);

    // 侧边栏菜单点击事件
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // 添加测试模式切换快捷键
    document.addEventListener('keydown', function(event) {
        // Ctrl+Shift+T 切换测试模式
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
            toggleTestMode();
        }
    });
});

/**
 * 切换测试模式
 */
function toggleTestMode() {
    testMode = !testMode;
    const testModeBtn = document.getElementById('test-mode-btn');
    if (testModeBtn) {
        testModeBtn.innerHTML = `<i class="fas fa-vial"></i> 测试模式: ${testMode ? '开启' : '关闭'}`;
    }
    
    // 重新加载当前页面数据
    if (currentSection === 'dashboard') {
        loadDashboardData(testMode);
    } else if (currentSection === 'users') {
        loadUsers(1, testMode);
    }
    
    console.log(`测试模式已${testMode ? '开启' : '关闭'}`);
}

/**
 * 添加测试模式按钮
 */
function addTestModeToggle() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !document.getElementById('test-mode-btn')) {
        const testModeToggle = document.createElement('button');
        testModeToggle.id = 'test-mode-btn';
        testModeToggle.className = 'btn btn-warning';
        testModeToggle.style.marginRight = '10px';
        testModeToggle.innerHTML = `<i class="fas fa-vial"></i> 测试模式: ${testMode ? '开启' : '关闭'}`;
        testModeToggle.onclick = toggleTestMode;
        userMenu.prepend(testModeToggle);
    }
}

/**
 * 显示登录页面
 */
function showLoginPage() {
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('dashboard-container').style.display = 'none';
}

/**
 * 隐藏登录页面
 */
function hideLoginPage() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'flex';
    addTestModeToggle();
}

/**
 * 登录函数
 */
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginMsg = document.getElementById('login-message');

    if (!email || !password) {
        loginMsg.textContent = '请输入邮箱和密码';
        return;
    }

    try {
        const response = await fetch(`${config.apiBaseUrl}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // 检查是否为管理员
            if (data.data.user.role !== 'admin') {
                loginMsg.textContent = '您不是管理员，无法登录管理中心';
                return;
            }

            token = data.data.token;
            localStorage.setItem('adminToken', token);
            document.getElementById('admin-name').textContent = data.data.user.username;
            hideLoginPage();
            loadDashboardData(testMode);
        } else {
            loginMsg.textContent = data.message || '登录失败';
        }
    } catch (error) {
        console.error('登录错误:', error);
        loginMsg.textContent = '登录请求失败，请检查网络连接';

        // 在开发环境下添加测试登录选项
        const developmentMode = true; // 可以根据环境变量设置
        if (developmentMode) {
            setTimeout(() => {
                const useTestAccount = confirm('无法连接到服务器。是否使用测试账号登录？');
                if (useTestAccount) {
                    token = 'test_token';
                    localStorage.setItem('adminToken', token);
                    document.getElementById('admin-name').textContent = '测试管理员';
                    testMode = true; // 自动开启测试模式
                    hideLoginPage();
                    loadDashboardData(true);
                }
            }, 500);
        }
    }
}

/**
 * 退出登录
 */
function logout() {
    token = null;
    localStorage.removeItem('adminToken');
    showLoginPage();
}

/**
 * 切换显示的内容区域
 */
function showSection(section) {
    // 更新活跃菜单项
    document.querySelectorAll('.sidebar-item').forEach(item => {
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 更新页面标题
    const titles = {
        'dashboard': '控制台',
        'users': '用户管理',
        'contents': '内容管理',
        'orders': '订单管理',
        'payments': '支付管理',
        'comments': '评论管理',
        'notifications': '通知管理',
        'reports': '统计报表',
        'settings': '系统设置',
        'logs': '操作日志'
    };
    document.getElementById('page-title').textContent = titles[section] || '控制台';

    // 更新显示的内容区域
    document.querySelectorAll('.content-section').forEach(item => {
        if (item.id === `${section}-section`) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 加载对应页面的数据
    switch (section) {
        case 'dashboard':
            loadDashboardData(testMode);
            break;
        case 'users':
            loadUsers(1, testMode);
            break;
        case 'contents':
            // 加载内容数据
            break;
        // 更多页面的数据加载...
    }

    currentSection = section;
}

/**
 * 加载仪表盘数据
 */
async function loadDashboardData(useMockData = false) {
    try {
        const dashboardSection = document.getElementById('dashboard-section');
        
        // 显示加载状态
        if (!dashboardSection.querySelector('.loader')) {
            const statValues = dashboardSection.querySelectorAll('.stat-value');
            statValues.forEach(el => {
                el.innerHTML = '<small><i class="fas fa-spinner fa-spin"></i> 加载中...</small>';
            });
        }
        
        let data;
        if (useMockData) {
            // 使用模拟数据
            console.log('使用模拟数据加载仪表盘');
            data = getMockDashboardData();
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            // 使用真实API数据
            data = await fetchApi('/admin/dashboard');
        }

        if (data.success) {
            // 更新统计数字
            document.getElementById('total-users').textContent = data.data.users.total.toLocaleString();
            document.getElementById('total-contents').textContent = data.data.content.published.toLocaleString();
            document.getElementById('total-orders').textContent = data.data.orders.completed.toLocaleString();
            document.getElementById('total-revenue').textContent = `¥${data.data.orders.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

            // 绘制用户图表
            drawUserChart(data.data.last7DaysUsers);

            // 绘制收入图表
            drawRevenueChart(data.data.last7DaysRevenue);

            // 绘制内容类型分布图
            drawContentTypeChart(data.data.contentTypeDistribution);

            // 绘制订单类型分布图
            drawOrderTypeChart(data.data.orderTypeDistribution);

            // 加载待审核内容
            loadPendingContents(useMockData);
        }
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        
        // 在错误情况下显示错误提示
        const dashboardCards = document.querySelector('.dashboard-cards');
        if (dashboardCards) {
            dashboardCards.innerHTML += `
                <div class="card card-danger" style="grid-column: 1 / -1; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>加载数据失败，请检查网络连接和后端服务状态。</p>
                    <button class="btn btn-primary" onclick="loadDashboardData(${testMode})">
                        <i class="fas fa-redo"></i> 重试
                    </button>
                    <button class="btn btn-warning" onclick="loadDashboardData(true)">
                        <i class="fas fa-vial"></i> 使用测试数据
                    </button>
                </div>
            `;
        }
    }
}

/**
 * 绘制用户图表
 */
function drawUserChart(userData) {
    const canvas = document.getElementById('user-chart');
    if (!canvas) {
        console.error('找不到user-chart画布元素');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 准备数据
    const labels = userData.map(item => item.date);
    const data = userData.map(item => item.count);
    
    // 清除旧图表
    if (window.userChart instanceof Chart) {
        window.userChart.destroy();
    }
    
    // 创建新图表
    try {
        window.userChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '新用户数',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    } catch (error) {
        console.error('创建用户图表失败:', error);
        canvas.parentElement.innerHTML += `<p class="text-danger">图表加载失败: ${error.message}</p>`;
    }
}

/**
 * 绘制收入图表
 */
function drawRevenueChart(revenueData) {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) {
        console.error('找不到revenue-chart画布元素');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 准备数据
    const labels = revenueData.map(item => item.date);
    const data = revenueData.map(item => item.amount);
    
    // 清除旧图表
    if (window.revenueChart instanceof Chart) {
        window.revenueChart.destroy();
    }
    
    // 创建新图表
    try {
        window.revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '收入(¥)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return '收入: ¥' + tooltipItem.value.toLocaleString();
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('创建收入图表失败:', error);
        canvas.parentElement.innerHTML += `<p class="text-danger">图表加载失败: ${error.message}</p>`;
    }
}

/**
 * 绘制内容类型分布图
 */
function drawContentTypeChart(contentTypeData) {
    const canvas = document.getElementById('content-type-chart');
    if (!canvas) {
        console.error('找不到content-type-chart画布元素');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 准备数据
    const labels = contentTypeData.map(item => {
        // 格式化内容类型名称
        switch(item._id) {
            case '180_video': return '180°视频';
            case '180_photo': return '180°照片';
            case '360_video': return '360°视频';
            case '360_photo': return '360°照片';
            case 'spatial_video': return '空间视频';
            case 'spatial_photo': return '空间照片';
            default: return item._id;
        }
    });
    const data = contentTypeData.map(item => item.count);
    const backgroundColors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
    ];
    
    // 清除旧图表
    if (window.contentTypeChart instanceof Chart) {
        window.contentTypeChart.destroy();
    }
    
    // 创建新图表
    try {
        window.contentTypeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'right'
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            const value = data.datasets[0].data[tooltipItem.index];
                            const label = data.labels[tooltipItem.index];
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('创建内容类型图表失败:', error);
        canvas.parentElement.innerHTML += `<p class="text-danger">图表加载失败: ${error.message}</p>`;
    }
}

/**
 * 绘制订单类型分布图
 */
function drawOrderTypeChart(orderTypeData) {
    const canvas = document.getElementById('order-type-chart');
    if (!canvas) {
        console.error('找不到order-type-chart画布元素');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 准备数据
    const labels = orderTypeData.map(item => {
        // 格式化订单类型名称
        switch(item._id) {
            case 'subscription': return '订阅';
            case 'content': return '内容购买';
            case 'tip': return '打赏';
            default: return item._id;
        }
    });
    const data = orderTypeData.map(item => item.amount);
    const backgroundColors = [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)'
    ];
    
    // 清除旧图表
    if (window.orderTypeChart instanceof Chart) {
        window.orderTypeChart.destroy();
    }
    
    // 创建新图表
    try {
        window.orderTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'right'
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            const value = data.datasets[0].data[tooltipItem.index];
                            const label = data.labels[tooltipItem.index];
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('创建订单类型图表失败:', error);
        canvas.parentElement.innerHTML += `<p class="text-danger">图表加载失败: ${error.message}</p>`;
    }
}

/**
 * 加载待审核内容
 */
async function loadPendingContents(useMockData = false) {
    try {
        const tableBody = document.querySelector('#pending-contents-table tbody');
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><div class="loader"></div> 加载中...</td></tr>';
        
        let data;
        if (useMockData) {
            // 使用模拟数据
            console.log('使用模拟数据加载待审核内容');
            data = getMockPendingContents();
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 800));
        } else {
            // 使用真实API数据
            data = await fetchApi('/admin/contents?status=pending_review&limit=5');
        }

        if (data.success) {
            tableBody.innerHTML = '';

            if (data.data.contents.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">暂无待审核内容</td></tr>';
            } else {
                data.data.contents.forEach(content => {
                    const row = document.createElement('tr');
                    const createdAt = new Date(content.createdAt).toLocaleString();
                    
                    row.innerHTML = `
                        <td>${content._id}</td>
                        <td>${content.title['zh-CN'] || content.title['en-US'] || '无标题'}</td>
                        <td>${formatContentType(content.contentType)}</td>
                        <td>${content.creatorId ? content.creatorId.username : '未知'}</td>
                        <td>${createdAt}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="reviewContent('${content._id}', true)">
                                <i class="fas fa-check"></i> 批准
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="reviewContent('${content._id}', false)">
                                <i class="fas fa-times"></i> 拒绝
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('加载待审核内容失败:', error);
        const tableBody = document.querySelector('#pending-contents-table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">
                    <div class="text-danger">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </div>
                    <button class="btn btn-primary btn-sm mt-2" onclick="loadPendingContents(${testMode})">
                        <i class="fas fa-redo"></i> 重试
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * 审核内容
 */
async function reviewContent(contentId, approved) {
    const reviewNote = prompt('请输入审核意见:');
    if (reviewNote === null) return; // 用户取消了输入
    
    try {
        if (testMode) {
            // 模拟审核操作
            console.log(`模拟审核内容: ID=${contentId}, 批准=${approved}, 意见=${reviewNote}`);
            await new Promise(resolve => setTimeout(resolve, 800));
            alert(`内容已${approved ? '批准' : '拒绝'}`);
            loadPendingContents(testMode);
            return;
        }
        
        const response = await fetchApi(`/admin/contents/${contentId}/review`, {
            method: 'PUT',
            body: JSON.stringify({
                approved,
                reviewNote
            })
        });

        if (response.success) {
            alert(`内容已${approved ? '批准' : '拒绝'}`);
            
            // 如果当前在仪表盘页面，刷新待审核内容列表
            if (currentSection === 'dashboard') {
                loadPendingContents(testMode);
            }
        } else {
            alert(`操作失败: ${response.message}`);
        }
    } catch (error) {
        console.error('审核内容失败:', error);
        alert('操作失败，请检查网络连接');
    }
}

/**
 * 格式化内容类型
 */
function formatContentType(type) {
    switch(type) {
        case '180_video': return '180°视频';
        case '180_photo': return '180°照片';
        case '360_video': return '360°视频';
        case '360_photo': return '360°照片';
        case 'spatial_video': return '空间视频';
        case 'spatial_photo': return '空间照片';
        default: return type;
    }
}

/**
 * 加载用户管理页面
 */
async function loadUsers(page = 1, useMockData = false) {
    if (currentSection !== 'users') return;
    
    try {
        // 如果是首次加载，添加搜索栏和表格
        if (!document.getElementById('users-table')) {
            const usersSection = document.getElementById('users-section');
            usersSection.innerHTML = `
                <h2>用户管理</h2>
                
                <div class="search-bar">
                    <input type="text" id="user-search" class="search-input" placeholder="搜索用户名或邮箱">
                    <select id="user-role" class="form-control">
                        <option value="">所有角色</option>
                        <option value="user">普通用户</option>
                        <option value="creator">创作者</option>
                        <option value="admin">管理员</option>
                    </select>
                    <select id="user-status" class="form-control">
                        <option value="">所有状态</option>
                        <option value="active">活跃</option>
                        <option value="suspended">已暂停</option>
                        <option value="deleted">已删除</option>
                    </select>
                    <button class="btn btn-primary" id="user-search-btn">
                        <i class="fas fa-search"></i> 搜索
                    </button>
                </div>
                
                <div class="table-container">
                    <table class="table" id="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户名</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>状态</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="7" style="text-align: center;"><div class="loader"></div> 加载中...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div id="users-pagination" class="pagination"></div>
            `;
            
            // 添加搜索按钮点击事件
            document.getElementById('user-search-btn').addEventListener('click', () => loadUsers(1, testMode));
        }
        
        const search = document.getElementById('user-search') ? document.getElementById('user-search').value : '';
        const role = document.getElementById('user-role') ? document.getElementById('user-role').value : '';
        const status = document.getElementById('user-status') ? document.getElementById('user-status').value : '';
        
        let query = `page=${page}&limit=10`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (role) query += `&role=${role}`;
        if (status) query += `&status=${status}`;
        
        // 显示加载状态
        const tableBody = document.getElementById('users-table').querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="loader"></div> 加载中...</td></tr>';
        
        let data;
        if (useMockData) {
            // 生成模拟用户数据
            console.log('使用模拟数据加载用户列表');
            data = generateMockUsers(page, search, role, status);
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 800));
        } else {
            // 使用真实API数据
            data = await fetchApi(`/admin/users?${query}`);
        }
        
        if (data.success) {
            tableBody.innerHTML = '';
            
            if (data.data.users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">暂无用户数据</td></tr>';
            } else {
                data.data.users.forEach(user => {
                    const row = document.createElement('tr');
                    const createdAt = new Date(user.createdAt).toLocaleString();
                    
                    row.innerHTML = `
                        <td>${user._id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${formatUserRole(user.role)}</td>
                        <td>${formatUserStatus(user.status)}</td>
                        <td>${createdAt}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="viewUserDetails('${user._id}')">
                                <i class="fas fa-eye"></i> 详情
                            </button>
                            <button class="btn ${user.status === 'active' ? 'btn-warning' : 'btn-success'} btn-sm" onclick="changeUserStatus('${user._id}', '${user.status === 'active' ? 'suspended' : 'active'}')">
                                <i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i> ${user.status === 'active' ? '禁用' : '启用'}
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
            
            // 生成分页控件
            generatePagination('users-pagination', data.data.pagination, (p) => loadUsers(p, useMockData));
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
        const tableBody = document.getElementById('users-table').querySelector('tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">
                    <div class="text-danger">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </div>
                    <button class="btn btn-primary btn-sm mt-2" onclick="loadUsers(1, ${testMode})">
                        <i class="fas fa-redo"></i> 重试
                    </button>
                    <button class="btn btn-warning btn-sm mt-2" onclick="loadUsers(1, true)">
                        <i class="fas fa-vial"></i> 使用测试数据
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * 生成模拟用户数据
 */
function generateMockUsers(page, search, role, status) {
    // 生成一组固定的模拟用户
    const allUsers = [
        {
            _id: '60a1b2c3d4e5f6a7b8c9d0e1',
            username: '王小明',
            email: 'xiaoming@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-05T08:30:45.000Z'
        },
        {
            _id: '60a2b3c4d5e6f7a8b9c0d1e2',
            username: '李小红',
            email: 'xiaohong@example.com',
            role: 'creator',
            status: 'active',
            createdAt: '2024-01-08T14:22:10.000Z'
        },
        {
            _id: '60a3b4c5d6e7f8a9b0c1d2e3',
            username: '张大壮',
            email: 'dazhuang@example.com',
            role: 'user',
            status: 'suspended',
            createdAt: '2024-01-12T19:15:30.000Z'
        },
        {
            _id: '60a4b5c6d7e8f9a0b1c2d3e4',
            username: '赵小花',
            email: 'xiaohua@example.com',
            role: 'creator',
            status: 'active',
            createdAt: '2024-01-15T11:05:20.000Z'
        },
        {
            _id: '60a5b6c7d8e9f0a1b2c3d4e5',
            username: '陈管理',
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
            createdAt: '2024-01-02T10:00:00.000Z'
        },
        {
            _id: '60a6b7c8d9e0f1a2b3c4d5e6',
            username: '刘小鱼',
            email: 'xiaoyu@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-18T16:40:15.000Z'
        },
        {
            _id: '60a7b8c9d0e1f2a3b4c5d6e7',
            username: '孙小猴',
            email: 'xiaohou@example.com',
            role: 'creator',
            status: 'deleted',
            createdAt: '2024-01-20T09:25:50.000Z'
        },
        {
            _id: '60a8b9c0d1e2f3a4b5c6d7e8',
            username: '周小狗',
            email: 'xiaogou@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-22T13:10:35.000Z'
        },
        {
            _id: '60a9b0c1d2e3f4a5b6c7d8e9',
            username: '吴小猫',
            email: 'xiaomao@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-25T17:55:25.000Z'
        },
        {
            _id: '60a0b1c2d3e4f5a6b7c8d9e0',
            username: '郑大鹏',
            email: 'dapeng@example.com',
            role: 'creator',
            status: 'suspended',
            createdAt: '2024-01-28T20:30:40.000Z'
        },
        {
            _id: '61a1b2c3d4e5f6a7b8c9d0e1',
            username: '冯小白',
            email: 'xiaobai@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-02-01T08:45:15.000Z'
        },
        {
            _id: '61a2b3c4d5e6f7a8b9c0d1e2',
            username: '蒋小黑',
            email: 'xiaohei@example.com',
            role: 'creator',
            status: 'active',
            createdAt: '2024-02-05T11:20:30.000Z'
        }
    ];
    
    // 根据搜索条件筛选用户
    let filteredUsers = [...allUsers];
    
    if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
            user.username.toLowerCase().includes(searchLower) || 
            user.email.toLowerCase().includes(searchLower)
        );
    }
    
    if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (status) {
        filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // 分页
    const limit = 10;
    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return {
        success: true,
        data: {
            users: paginatedUsers,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        }
    };
}

/**
 * 查看用户详情
 */
async function viewUserDetails(userId) {
    try {
        // 显示正在加载的弹窗
        if (!document.getElementById('user-details-modal')) {
            const modal = document.createElement('div');
            modal.id = 'user-details-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn" onclick="closeModal('user-details-modal')">&times;</span>
                    <h2>用户详情</h2>
                    <div id="user-details-body">
                        <div class="loader"></div> 加载中...
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            document.getElementById('user-details-body').innerHTML = '<div class="loader"></div> 加载中...';
        }
        
        // 显示弹窗
        document.getElementById('user-details-modal').style.display = 'block';
        
        let data;
        if (testMode) {
            // 生成模拟用户详情数据
            console.log('使用模拟数据加载用户详情:', userId);
            data = generateMockUserDetails(userId);
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 800));
        } else {
            // 使用真实API数据
            data = await fetchApi(`/admin/users/${userId}`);
        }
        
        if (data.success) {
            const user = data.data.user;
            const stats = data.data.stats;
            
            // 填充用户详情
            const detailsBody = document.getElementById('user-details-body');
            detailsBody.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <p><strong>ID:</strong> ${user._id}</p>
                    <p><strong>用户名:</strong> ${user.username}</p>
                    <p><strong>邮箱:</strong> ${user.email}</p>
                    <p><strong>角色:</strong> ${formatUserRole(user.role)}</p>
                    <p><strong>状态:</strong> ${formatUserStatus(user.status)}</p>
                    <p><strong>注册时间:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
                    <p><strong>最后登录:</strong> ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '未登录'}</p>
                    <p><strong>内容数量:</strong> ${stats.contentCount}</p>
                    <p><strong>订阅状态:</strong> ${stats.hasSubscription ? '已订阅' : '未订阅'}</p>
                </div>
                
                <h3>最近订单</h3>
                <div class="table-container" style="max-height: 200px; overflow-y: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>订单号</th>
                                <th>类型</th>
                                <th>金额</th>
                                <th>状态</th>
                                <th>时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.recentOrders.length > 0 ? 
                                stats.recentOrders.map(order => `
                                    <tr>
                                        <td>${order.orderNo}</td>
                                        <td>${formatOrderType(order.orderType)}</td>
                                        <td>¥${order.amount.toFixed(2)}</td>
                                        <td>${formatOrderStatus(order.paymentStatus)}</td>
                                        <td>${new Date(order.createdAt).toLocaleString()}</td>
                                    </tr>
                                `).join('') : 
                                '<tr><td colspan="5" style="text-align: center;">暂无订单记录</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('获取用户详情失败:', error);
        
        if (document.getElementById('user-details-body')) {
            document.getElementById('user-details-body').innerHTML = `
                <div class="text-danger">
                    <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                </div>
                <button class="btn btn-primary btn-sm mt-2" onclick="viewUserDetails('${userId}')">
                    <i class="fas fa-redo"></i> 重试
                </button>
                <button class="btn btn-warning btn-sm mt-2" onclick="viewUserDetails('${userId}', true)">
                    <i class="fas fa-vial"></i> 使用测试数据
                </button>
            `;
        }
    }
}

/**
 * 生成模拟用户详情数据
 */
function generateMockUserDetails(userId) {
    // 根据用户ID生成一致的模拟数据
    const userIdLastDigit = parseInt(userId.slice(-1), 16) % 10;
    
    // 模拟用户详情
    const user = {
        _id: userId,
        username: ['王小明', '李小红', '张大壮', '赵小花', '陈管理', '刘小鱼', '孙小猴', '周小狗', '吴小猫', '郑大鹏'][userIdLastDigit],
        email: `user${userIdLastDigit}@example.com`,
        role: ['user', 'creator', 'user', 'creator', 'admin', 'user', 'creator', 'user', 'user', 'creator'][userIdLastDigit],
        status: ['active', 'active', 'suspended', 'active', 'active', 'active', 'deleted', 'active', 'active', 'suspended'][userIdLastDigit],
        createdAt: new Date(Date.now() - (userIdLastDigit + 1) * 86400000 * 10).toISOString(),
        lastLoginAt: new Date(Date.now() - (userIdLastDigit + 1) * 3600000).toISOString()
    };
    
    // 模拟统计数据
    const stats = {
        contentCount: userIdLastDigit * 3 + 5,
        hasSubscription: userIdLastDigit % 3 === 0,
        recentOrders: []
    };
    
    // 生成一些随机订单
    const orderCount = userIdLastDigit % 5 + 2;
    for (let i = 0; i < orderCount; i++) {
        stats.recentOrders.push({
            orderNo: `ORD${Date.now().toString().slice(-8)}${i}${userIdLastDigit}`,
            orderType: ['subscription', 'content', 'tip'][i % 3],
            amount: Math.round((userIdLastDigit * 50 + i * 25 + Math.random() * 100) * 100) / 100,
            paymentStatus: ['pending', 'paid', 'failed', 'paid', 'refunded'][i % 5],
            createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString()
        });
    }
    
    return {
        success: true,
        data: {
            user,
            stats
        }
    };
}

/**
 * 修改用户状态
 */
async function changeUserStatus(userId, status) {
    const reason = prompt('请输入修改原因:');
    if (reason === null) return; // 用户取消了输入
    
    try {
        if (testMode) {
            // 模拟修改用户状态
            console.log(`模拟修改用户状态: ID=${userId}, 状态=${status}, 原因=${reason}`);
            await new Promise(resolve => setTimeout(resolve, 800));
            alert(`用户状态已更新为${formatUserStatus(status)}`);
            
            // 如果当前在用户管理页面，刷新用户列表
            if (currentSection === 'users') {
                loadUsers(1, testMode);
            }
            return;
        }
        
        const response = await fetchApi(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status,
                reason
            })
        });
        
        if (response.success) {
            alert(`用户状态已更新为${formatUserStatus(status)}`);
            
            // 如果当前在用户管理页面，刷新用户