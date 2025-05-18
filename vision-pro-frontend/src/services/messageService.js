// src/services/messageService.js
import { message as antMessage, notification as antNotification } from 'antd';

// 静态消息方法的包装器
export const message = {
  success: (content, duration, onClose) => {
    return antMessage.success(content, duration, onClose);
  },
  error: (content, duration, onClose) => {
    return antMessage.error(content, duration, onClose);
  },
  info: (content, duration, onClose) => {
    return antMessage.info(content, duration, onClose);
  },
  warning: (content, duration, onClose) => {
    return antMessage.warning(content, duration, onClose);
  },
  loading: (content, duration, onClose) => {
    return antMessage.loading(content, duration, onClose);
  },
};

// 静态通知方法的包装器
export const notification = {
  success: (args) => {
    return antNotification.success(args);
  },
  error: (args) => {
    return antNotification.error(args);
  },
  info: (args) => {
    return antNotification.info(args);
  },
  warning: (args) => {
    return antNotification.warning(args);
  },
};