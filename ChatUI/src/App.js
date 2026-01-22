import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import Chat from './pages/Chat';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Chat />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;