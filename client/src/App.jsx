import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import GuestLayout from './layouts/GuestLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Registry from './pages/Registry';
import Dashboard from './pages/Dashboard';
import DashboardGifts from './pages/DashboardGifts';
import DashboardPayout from './pages/DashboardPayout';
import DashboardManage from './pages/DashboardManage';
import MyGifts from './pages/MyGifts';
import DashboardSettings from './pages/DashboardSettings';
import DashboardFulfillment from './pages/DashboardFulfillment';
import AdminOverview from './pages/AdminOverview';
import AdminOrders from './pages/AdminOrders';
import AdminPendingPayments from './pages/AdminPendingPayments';
import ThankYou from './pages/ThankYou';
import WelcomeSplash from './pages/WelcomeSplash';
import WeddingSetup from './pages/WeddingSetup';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Support from './pages/Support';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FindWedding from './pages/FindWedding';
import Notifications from './pages/Notifications';
import DigitalGiftCard from './pages/DigitalGiftCard';
import GuestDashboard from './pages/GuestDashboard';
import AdminVendors from './pages/AdminVendors.jsx';
import AdminUsers from './pages/AdminUsers.jsx';

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
                <Route path="registry/:slug" element={<Registry />} />
                <Route path="wedding/:slug" element={<Navigate to="/w/:slug" replace />} />
                <Route path="auth" element={<Auth />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="thank-you" element={<ThankYou />} />
                <Route path="my-gifts" element={<MyGifts />} />
                <Route path="find-wedding" element={<FindWedding />} />
                <Route path="digital-gift-card/:id" element={<DigitalGiftCard />} />
                <Route path="privacy-policy" element={<PrivacyPolicy />} />
                <Route path="terms-of-service" element={<TermsOfService />} />
                <Route path="support" element={<Support />} />
              </Route>

              <Route element={<ProtectedRoute role="couple"><DashboardLayout /></ProtectedRoute>}>
                <Route path="/welcome" element={<WelcomeSplash />} />
                <Route path="/setup" element={<WeddingSetup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/gifts" element={<DashboardGifts />} />
                <Route path="/dashboard/manage" element={<DashboardManage />} />
                <Route path="/dashboard/wallet" element={<DashboardPayout />} />
                <Route path="/dashboard/settings" element={<DashboardSettings />} />
                <Route path="/dashboard/fulfillment" element={<DashboardFulfillment />} />
                <Route path="/dashboard/notifications" element={<Notifications />} />
              </Route>

              <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/verify-payments" element={<AdminPendingPayments />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/vendors" element={<AdminVendors />} />
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>

              <Route element={<ProtectedRoute role="guest"><GuestLayout /></ProtectedRoute>}>
                <Route path="/guest" element={<GuestDashboard />} />
                <Route path="/guest/*" element={<GuestDashboard />} />
              </Route>

              <Route path="/notifications" element={<Navigate to="/guest" replace />} />

              <Route path="login" element={<Navigate to="/auth" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
