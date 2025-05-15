// tests/creatorApi.test.js
import { creatorApi } from '../services/apiService';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('创作者API集成测试', () => {
  let mock;
  
  beforeAll(() => {
    mock = new MockAdapter(axios);
  });
  
  afterEach(() => {
    mock.reset();
  });
  
  afterAll(() => {
    mock.restore();
  });
  
  test('getContents应该获取内容列表', async () => {
    const mockResponse = {
      success: true,
      data: {
        contents: [{ _id: '1', title: { 'zh-CN': '测试内容' }}],
        pagination: { total: 1, pages: 1 }
      }
    };
    
    mock.onGet('/creator/contents').reply(200, mockResponse);
    
    const response = await creatorApi.getContents();
    expect(response.data).toEqual(mockResponse);
    expect(response.data.data.contents.length).toBe(1);
  });
  
  test('createContent应该发送新内容数据', async () => {
    const contentData = {
      title: { 'zh-CN': '新内容', 'en-US': '新内容' },
      contentType: '180_video'
    };
    
    const mockResponse = {
      success: true,
      data: { _id: '123', ...contentData }
    };
    
    mock.onPost('/creator/contents').reply(200, mockResponse);
    
    const response = await creatorApi.createContent(contentData);
    expect(response.data).toEqual(mockResponse);
  });
  
  // 添加更多API端点的测试
});