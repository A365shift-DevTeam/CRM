import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Auth/Login';

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
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

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

            <Route path="ai-agents" element={<PrivateRoute permission="aiagents.view"><AIAgentsLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="ai-followup" replace />} />
              <Route path="ai-followup" element={<AIFollowup />} />
              <Route path="vendor" element={<Vendor />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
