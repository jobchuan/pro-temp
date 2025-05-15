// tests/creatorFlow.test.js
describe('创作者内容管理流程', () => {
  test('创作者可以创建、查看和编辑内容', async () => {
    // 先登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'creator@example.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // 进入创作者仪表盘
    await page.goto('/creator/contents');
    expect(await page.title()).toContain('内容库');
    
    // 创建新内容
    await page.click('text=创建新内容');
    await page.fill('input[name="title.zh-CN"]', 'E2E测试内容');
    await page.fill('textarea[name="description.zh-CN"]', '这是一个测试内容');
    await page.selectOption('select[name="contentType"]', '180_video');
    
    // 上传测试文件（模拟）
    await page.setInputFiles('input[type="file"]', 'test-files/sample-video.mp4');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 验证内容创建成功
    await page.waitForNavigation();
    expect(page.url()).toContain('/creator/content/');
    
    // 回到内容库
    await page.goto('/creator/contents');
    
    // 验证内容出现在列表中
    expect(await page.textContent('.content-grid')).toContain('E2E测试内容');
  });
});