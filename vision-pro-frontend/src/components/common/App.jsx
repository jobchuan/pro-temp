// src/components/common/App.jsx
/**
 * 这个文件是一个重定向组件，用于解决路径问题
 * 实际的App.jsx应该在src根目录下
 */

// 导出需要的组件和钩子以解决导入错误
import LoginPage from '../../pages/login/LoginPage';
import NotFoundPage from '../../pages/error/NotFoundPage';
import ErrorBoundary from './ErrorBoundary';
import { useCurrentUser } from '../../hooks/useUser';

export { LoginPage, NotFoundPage, ErrorBoundary, useCurrentUser };

// 导出默认App组件
import App from '../../App';
export default App;
