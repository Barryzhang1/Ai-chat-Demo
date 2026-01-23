import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import Register from './pages/Register/Register';
import RoleSelect from './pages/RoleSelect/RoleSelect';
import UserOrder from './pages/UserOrder/UserOrder';
import MerchantDashboard from './pages/MerchantDashboard/MerchantDashboard';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const userName = localStorage.getItem('userName');
  return userName ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Register />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <RoleSelect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-order"
              element={
                <ProtectedRoute>
                  <UserOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant"
              element={
                <ProtectedRoute>
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;