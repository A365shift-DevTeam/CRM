import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

import Dashboard from './pages/Dashboard/Dashboard';
import Sales from './pages/Sales/Sales';
import Contact from './pages/Contact/Contacts/Contacts';
import Timesheet from './pages/Timesheet/Timesheet';
import Finance from './pages/Finance/Finance';
import TodoList from './pages/TodoList/TodoList';
import Invoice from './pages/Invoice/Invoice';
import AIFollowup from './pages/AIFollowup/AIFollowup';
import Vendor from './pages/Vendor/Vendor';
import AIAgentsLayout from './pages/AIAgents/AIAgentsLayout';
import Admin from './pages/Admin/Admin';
import Settings from './pages/Settings/Settings';
import Projects from './pages/Projects/Projects';
import Documents from './pages/Documents/Documents';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

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
    <Router>
      <AuthProvider>
        <ThemeProvider>
        <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
            
            {/* Newly added placeholder routes for Sidebar */}
            <Route path="company" element={<PrivateRoute permission="contacts.view"><PlaceholderPage title="Company" /></PrivateRoute>} />
            <Route path="leads" element={<PrivateRoute permission="sales.view"><PlaceholderPage title="Leads" /></PrivateRoute>} />
            <Route path="projects" element={<PrivateRoute permission="timesheet.view"><Projects /></PrivateRoute>} />
            <Route path="hr" element={<PrivateRoute permission="dashboard.view"><PlaceholderPage title="HR" /></PrivateRoute>} />
            <Route path="legal" element={<PrivateRoute permission="invoice.view"><PlaceholderPage title="Legal" /></PrivateRoute>} />
            <Route path="documents" element={<PrivateRoute permission="dashboard.view"><Documents /></PrivateRoute>} />
            <Route path="links" element={<PrivateRoute permission="dashboard.view"><PlaceholderPage title="Links" /></PrivateRoute>} />

            <Route path="ai-agents" element={<PrivateRoute permission="aiagents.view"><AIAgentsLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="ai-followup" replace />} />
              <Route path="ai-followup" element={<AIFollowup />} />
              <Route path="vendor" element={<Vendor />} />
            </Route>
          </Route>
        </Routes>
        </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
