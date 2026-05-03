import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Registry from './pages/Registry';
import Dashboard from './pages/Dashboard';
import DashboardGifts from './pages/DashboardGifts';
import DashboardPayout from './pages/DashboardPayout';
import MyGifts from "./pages/MyGifts.jsx";
import DashboardSettings from './pages/DashboardSettings';
import AdminOverview from './pages/AdminOverview';
import AdminOrders from './pages/AdminOrders';
import ThankYou from './pages/ThankYou';
import WelcomeSplash from './pages/WelcomeSplash';
import WeddingSetup from './pages/WeddingSetup';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-ivory text-dark">
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Landing />} />
                <Route path="w/:slug" element={<Registry />} />
                <Route path="wedding/:slug" element={<Navigate to="/w/:slug" replace />} />
                <Route path="auth" element={<Auth />} />
                <Route path="thank-you" element={<ThankYou />} />
                <Route path="my-gifts" element={<MyGifts />} />
              </Route>

              <Route element={<ProtectedRoute role="couple"><DashboardLayout /></ProtectedRoute>}>
                <Route path="/welcome" element={<WelcomeSplash />} />
                <Route path="/setup" element={<WeddingSetup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/gifts" element={<DashboardGifts />} />
                <Route path="/dashboard/wallet" element={<DashboardPayout />} />
                <Route path="/dashboard/settings" element={<DashboardSettings />} />
              </Route>

              <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;