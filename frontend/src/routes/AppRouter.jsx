import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar  from '../components/layout/Navbar';
import Footer  from '../components/layout/Footer';
import Spinner from '../components/ui/Spinner';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute     from './AdminRoute';

// ── Code-split every page into its own JS chunk ───────────────────────────────
// Vite will emit separate files per lazy import.
// Each chunk is only downloaded when the user navigates to that route,
// keeping the initial bundle small and improving First Contentful Paint.
const HomePage          = lazy(() => import('../pages/HomePage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const CartPage          = lazy(() => import('../pages/CartPage'));
const CheckoutPage      = lazy(() => import('../pages/CheckoutPage'));
const OrderSuccessPage  = lazy(() => import('../pages/OrderSuccessPage'));
const OrderHistoryPage  = lazy(() => import('../pages/OrderHistoryPage'));
const OrderDetailPage   = lazy(() => import('../pages/OrderDetailPage'));
const LoginPage         = lazy(() => import('../pages/LoginPage'));
const RegisterPage      = lazy(() => import('../pages/RegisterPage'));
const ProfilePage       = lazy(() => import('../pages/ProfilePage'));
const WishlistPage      = lazy(() => import('../pages/WishlistPage'));
const NotFoundPage      = lazy(() => import('../pages/NotFoundPage'));

// Admin pages — separate chunk group, only loaded for admin users
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminProducts  = lazy(() => import('../pages/admin/AdminProducts'));
const AdminOrders    = lazy(() => import('../pages/admin/AdminOrders'));
const AdminUsers     = lazy(() => import('../pages/admin/AdminUsers'));

// ── Fallback shown while a lazy chunk is downloading ──────────────────────────
const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Spinner size="lg" color="primary" />
  </div>
);

export default function AppRouter() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/"               element={<HomePage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart"           element={<CartPage />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/register"       element={<RegisterPage />} />

            {/* Protected — customer */}
            <Route path="/checkout"      element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
            <Route path="/orders"        element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
            <Route path="/orders/:id"    element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/wishlist"      element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/users"    element={<AdminRoute><AdminUsers /></AdminRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
