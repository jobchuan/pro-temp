// src/locales/i18n.js
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// 语言资源
const resources = {
  'zh-CN': {
    translation: {
      // 通用
      loading: '加载中',
      success: '成功',
      error: '错误',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      preview: '预览',
      
      // 登录页
      login: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      forgotPassword: '忘记密码',
      rememberMe: '记住我',
      loginSuccess: '登录成功',
      
      // 内容管理
      content: '内容',
      contentList: '内容列表',
      newContent: '新建内容',
      title: '标题',
      description: '描述',
      status: '状态',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      publish: '发布',
      
      // 状态
      draft: '草稿',
      pending_review: '待审核',
      approved: '已批准',
      published: '已发布',
      rejected: '已拒绝',
      archived: '已归档'
    }
  },
  'en-US': {
    translation: {
      // Common
      loading: 'Loading',
      success: 'Success',
      error: 'Error',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      preview: 'Preview',
      
      // Login
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password',
      rememberMe: 'Remember Me',
      loginSuccess: 'Login Successful',
      
      // Content
      content: 'Content',
      contentList: 'Content List',
      newContent: 'New Content',
      title: 'Title',
      description: 'Description',
      status: 'Status',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      publish: 'Publish',
      
      // Status
      draft: 'Draft',
      pending_review: 'Pending Review',
      approved: 'Approved',
      published: 'Published',
      rejected: 'Rejected',
      archived: 'Archived'
    }
  }
}

// 初始化i18n
export const setupI18n = () => {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: localStorage.getItem('language') || 'zh-CN',
      fallbackLng: 'zh-CN',
      interpolation: {
        escapeValue: false
      }
    })
  
  return i18n
}

export default i18n
