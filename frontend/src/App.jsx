import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import StorageLimitHandler from './components/StorageLimitHandler/StorageLimitHandler';
import './index.css';

const Dashboard      = lazy(() => import('./pages/Dashboard/Dashboard'));
const Sales          = lazy(() => import('./pages/Sales/Sales'));
const Contact        = lazy(() => import('./pages/Contact/Contacts/Contacts'));
const Timesheet      = lazy(() => import('./pages/Timesheet/Timesheet'));
const Finance        = lazy(() => import('./pages/Finance/Finance'));
const TodoList       = lazy(() => import('./pages/TodoList/TodoList'));
const Invoice        = lazy(() => import('./pages/Invoice/Invoice'));
const AIFollowup     = lazy(() => import('./pages/AIFollowup/AIFollowup'));
const Vendor         = lazy(() => import('./pages/Vendor/Vendor'));
const AIAgentsLayout = lazy(() => import('./pages/AIAgents/AIAgentsLayout'));
const Admin          = lazy(() => import('./pages/Admin/Admin'));
const Settings       = lazy(() => import('./pages/Settings/Settings'));
const Projects       = lazy(() => import('./pages/Projects/Projects'));
const Documents      = lazy(() => import('./pages/Documents/Documents'));
const Company        = lazy(() => import('./pages/Company/Company'));
const Leads          = lazy(() => import('./pages/Leads/Leads'));
const Calendar       = lazy(() => import('./pages/Calendar/Calendar'));
const Reports        = lazy(() => import('./pages/Reports/Reports'));
const Legal          = lazy(() => import('./pages/Legal/Legal'));
const Tickets        = lazy(() => import('./pages/Tickets/Tickets'));
const PaymentSuccess = lazy(() => import('./pages/Payment/PaymentSuccess'));

function PlaceholderPage({ title }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500">This module is currently under construction.</p>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <Router>
      <AuthProvider>
        <ThemeProvider>
        <ToastProvider>
        <StorageLimitHandler />
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#4361EE', fontSize: 14 }}>
            Loading…
          </div>
        }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />

          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
            <Route index element={<PrivateRoute permission="dashboard.view"><Dashboard /></PrivateRoute>} />
            <Route path="sales" element={<PrivateRoute permission="sales.view"><Sales /></PrivateRoute>} />
            <Route path="contact" element={<PrivateRoute permission="contacts.view"><Contact /></PrivateRoute>} />
            <Route path="timesheet" element={<PrivateRoute permission="timesheet.view"><Timesheet /></PrivateRoute>} />
            <Route path="finance" element={<PrivateRoute permission="finance.view"><Finance /></PrivateRoute>} />
            <Route path="todolist" element={<PrivateRoute permission="todolist.view"><TodoList /></PrivateRoute>} />
            <Route path="invoice" element={<PrivateRoute permission="invoice.view"><Invoice /></PrivateRoute>} />
            <Route path="admin" element={<PrivateRoute permission="admin.view"><Admin /></PrivateRoute>} />
            <Route path="settings" element={<PrivateRoute permission="dashboard.view"><Settings /></PrivateRoute>} />

            {/* CRM modules */}
            <Route path="company" element={<PrivateRoute permission="contacts.view"><Company /></PrivateRoute>} />
            <Route path="leads" element={<PrivateRoute permission="sales.view"><Leads /></PrivateRoute>} />
            <Route path="projects" element={<PrivateRoute permission="timesheet.view"><Projects /></PrivateRoute>} />
            <Route path="hr" element={<PrivateRoute permission="dashboard.view"><PlaceholderPage title="HR" /></PrivateRoute>} />
            <Route path="legal" element={<PrivateRoute permission="invoice.view"><Legal /></PrivateRoute>} />
            <Route path="tickets" element={<PrivateRoute permission="dashboard.view"><Tickets /></PrivateRoute>} />
            <Route path="documents" element={<PrivateRoute permission="dashboard.view"><Documents /></PrivateRoute>} />
            <Route path="calendar" element={<PrivateRoute permission="dashboard.view"><Calendar /></PrivateRoute>} />
            <Route path="reports" element={<PrivateRoute permission="dashboard.view"><Reports /></PrivateRoute>} />

            <Route path="ai-agents" element={<PrivateRoute permission="aiagents.view"><AIAgentsLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="ai-followup" replace />} />
              <Route path="ai-followup" element={<AIFollowup />} />
              <Route path="vendor" element={<Vendor />} />
            </Route>
          </Route>
        </Routes>
        </Suspense>
        </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
