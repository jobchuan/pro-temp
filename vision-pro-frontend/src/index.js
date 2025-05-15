import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 仅在开发环境中启用模拟
if (process.env.NODE_ENV === 'development') {
  Promise.all([
    import('./mocks/uploadMock'),
    import('./mocks/authMock')
  ]).then(() => {
    console.log('Mock servers are running');
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);