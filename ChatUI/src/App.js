import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import enUS from 'antd-mobile/es/locales/en-US';
import Register from './pages/Register/Register';
import RoleSelect from './pages/RoleSelect/RoleSelect';
import UserOrder from './pages/UserOrder/UserOrder';
import MenuBrowse from './pages/MenuBrowse/MenuBrowse';
import MerchantDashboard from './pages/MerchantDashboard/MerchantDashboard';
import OrderList from './pages/MerchantDashboard/OrderList';
import Inventory from './pages/MerchantDashboard/Inventory';
import IngredientConsumeHistory from './pages/MerchantDashboard/IngredientConsumeHistory';
import SeatManagement from './pages/MerchantDashboard/SeatManagement';
import GameRankings from './pages/MerchantDashboard/GameRankings';
import DataReports from './pages/MerchantDashboard/DataReports';
import AddDish from './pages/MerchantDashboard/AddDish';
import CategoryManagement from './pages/MerchantDashboard/CategoryManagement';
import PermissionManagement from './pages/PermissionManagement/PermissionManagement';
import {
  PurchaseOrderList,
  CreatePurchaseOrder,
  InventoryList,
  InventoryHistory,
} from './pages/InventoryManagement';
import {
  RevenueStats,
  TransactionList,
  BatchCreateTransaction,
} from './pages/RevenueManagement';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { authUtils } from './utils/auth';
import { canAccessMerchant, isBoss } from './utils/permission';
import { Toast } from 'antd-mobile';
import './App.css';

const ProtectedRoute = ({ children }) => {
  return authUtils.isAuthenticated() ? children : <Navigate to="/" replace />;
};

// 商家后台路由保护（BOSS 和 STAFF 可访问）
const MerchantRoute = ({ children }) => {
  if (!authUtils.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  if (!canAccessMerchant()) {
    Toast.show({
      content: '权限不足，只有老板和员工可以访问',
      icon: 'fail'
    });
    return <Navigate to="/role-select" replace />;
  }
  
  return children;
};

// BOSS 专属路由保护（仅 BOSS 可访问）
const BossOnlyRoute = ({ children }) => {
  if (!authUtils.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  if (!isBoss()) {
    Toast.show({
      content: '权限不足，只有老板可以访问此功能',
      icon: 'fail'
    });
    return <Navigate to="/merchant" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { isEn } = useLanguage();

  return (
    <ConfigProvider locale={isEn ? enUS : zhCN}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Register />} />
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
                <MerchantRoute>
                  <MerchantDashboard />
                </MerchantRoute>
              }
            />
            <Route 
              path="/merchant/orders" 
              element={
                <MerchantRoute>
                  <OrderList />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/inventory" 
              element={
                <MerchantRoute>
                  <Inventory />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/inventory/:id/consume-history" 
              element={
                <MerchantRoute>
                  <IngredientConsumeHistory />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/seats" 
              element={
                <MerchantRoute>
                  <SeatManagement />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/rankings" 
              element={
                <MerchantRoute>
                  <GameRankings />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/categories" 
              element={
                <MerchantRoute>
                  <CategoryManagement />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/reports" 
              element={
                <BossOnlyRoute>
                  <DataReports />
                </BossOnlyRoute>
              } 
            />
            <Route 
              path="/merchant/permissions" 
              element={
                <BossOnlyRoute>
                  <PermissionManagement />
                </BossOnlyRoute>
              } 
            />
            <Route 
              path="/revenue" 
              element={
                <BossOnlyRoute>
                  <RevenueStats />
                </BossOnlyRoute>
              } 
            />
            <Route 
              path="/revenue/transactions" 
              element={
                <BossOnlyRoute>
                  <TransactionList />
                </BossOnlyRoute>
              } 
            />
            <Route 
              path="/revenue/transactions/create" 
              element={
                <BossOnlyRoute>
                  <BatchCreateTransaction />
                </BossOnlyRoute>
              } 
            />
            <Route 
              path="/merchant/add-dish" 
              element={
                <MerchantRoute>
                  <AddDish />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/inventory/purchase-order" 
              element={
                <MerchantRoute>
                  <PurchaseOrderList />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/inventory/purchase-order/create" 
              element={
                <MerchantRoute>
                  <CreatePurchaseOrder />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/inventory/list" 
              element={
                <MerchantRoute>
                  <InventoryList />
                </MerchantRoute>
              } 
            />
            <Route 
              path="/merchant/inventory/history" 
              element={
                <MerchantRoute>
                  <InventoryHistory />
                </MerchantRoute>
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