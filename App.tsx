
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceBuilder from './pages/InvoiceBuilder';
import Expenses from './pages/Expenses';
import Clients from './pages/Clients';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import Register from './pages/Register';
import Messages from './pages/Messages';
import DistributorPortal from './pages/DistributorPortal';
import DistributorCatalog from './pages/DistributorCatalog';
import DistributorLanding from './pages/DistributorLanding';
import ClientPortal from './pages/ClientPortal';
import { LanguageProvider } from './context/LanguageContext';
import { UserRole } from './types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<{ isAuthenticated: boolean; role: UserRole | null }>(() => {
    const isAuth = localStorage.getItem('isAuth') === 'true';
    const role = localStorage.getItem('userRole') as UserRole;
    return { isAuthenticated: isAuth, role: role || null };
  });

  const handleLogin = (role: UserRole) => {
    setAuth({ isAuthenticated: true, role });
    localStorage.setItem('isAuth', 'true');
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, role: null });
    localStorage.setItem('isAuth', 'false');
    localStorage.removeItem('userRole');
  };

  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/info" element={<DistributorLanding />} />
          <Route path="/register" element={<Register />} />
          
          {!auth.isAuthenticated ? (
            <>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/info" replace />} />
            </>
          ) : (
            <Route element={<Layout role={auth.role || UserRole.DISTRIBUTOR} onLogout={handleLogout} />}>
                {auth.role === UserRole.ADMIN ? (
                  <>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/invoices/new" element={<InvoiceBuilder />} />
                    <Route path="/invoices/edit/:id" element={<InvoiceBuilder />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                  </>
                ) : auth.role === UserRole.DISTRIBUTOR ? (
                  <>
                    <Route path="/" element={<DistributorPortal />} />
                    <Route path="/catalog" element={<DistributorCatalog />} />
                    <Route path="/orders" element={<Invoices />} />
                    <Route path="/messages" element={<Messages />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<ClientPortal />} />
                    <Route path="/messages" element={<Messages />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;
