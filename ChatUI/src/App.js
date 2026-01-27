import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import enUS from 'antd-mobile/es/locales/en-US';
import Register from './pages/Register/Register';
import RoleSelect from './pages/RoleSelect/RoleSelect';
import Chat from './pages/Chat/Chat';
import UserOrder from './pages/UserOrder/UserOrder';
import MenuBrowse from './pages/MenuBrowse/MenuBrowse';
import MerchantDashboard from './pages/MerchantDashboard/MerchantDashboard';
import OrderList from './pages/MerchantDashboard/OrderList';
import Inventory from './pages/MerchantDashboard/Inventory';
import SeatManagement from './pages/MerchantDashboard/SeatManagement';
import GameRankings from './pages/MerchantDashboard/GameRankings';
import DataReports from './pages/MerchantDashboard/DataReports';
import AddDish from './pages/MerchantDashboard/AddDish';
import CategoryManagement from './pages/MerchantDashboard/CategoryManagement';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { authUtils } from './utils/auth';
import './App.css';

const ProtectedRoute = ({ children }) => {
  return authUtils.isAuthenticated() ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  const { isEn } = useLanguage();

  return (
    <ConfigProvider locale={isEn ? enUS : zhCN}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/chat" element={<Chat />} />
            <Route
              path="/role-select"
              element={
                <ProtectedRoute>
                  <RoleSelect />
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
            <Route path="/merchant/orders" element={<OrderList />} />
            <Route path="/merchant/inventory" element={<Inventory />} />
            <Route path="/merchant/seats" element={<SeatManagement />} />
            <Route path="/merchant/rankings" element={<GameRankings />} />
            <Route path="/merchant/categories" element={<CategoryManagement />} />
            <Route path="/merchant/reports" element={<DataReports />} />
            <Route path="/merchant/add-dish" element={<AddDish />} />
            <Route
              path="/user-order"
              element={
                <ProtectedRoute>
                  <UserOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu-browse"
              element={
                <ProtectedRoute>
                  <MenuBrowse />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppRoutes />
    </LanguageProvider>
  );
}

export default App;