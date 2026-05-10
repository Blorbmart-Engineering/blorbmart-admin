import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { OverviewPage } from '@/pages/admin/overview-page'
import { SectionPage } from '@/pages/admin/section-page'
import { UsersPage } from '@/pages/admin/users-page'
import { VendorsPage } from '@/pages/admin/vendors-page'
import { ActivityPage } from '@/pages/admin/activity-page'
import { ProductsPage } from '@/pages/admin/products-page'
import { OrdersPage } from '@/pages/admin/orders-page'
import { SettingsPage } from '@/pages/admin/settings-page'
import { CommissionsPage } from '@/pages/admin/commissions-page'
import { DeliveryPage } from '@/pages/admin/delivery-page'
import { CarouselPage } from '@/pages/admin/carousel-page'
import { LoginPage } from '@/pages/login-page'
import { SignupPage } from '@/pages/signup-page'
import { RequireAdmin } from '@/lib/auth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        <Route
          path="/admin/overview"
          element={
            <RequireAdmin>
              <OverviewPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/sellers"
          element={
            <RequireAdmin>
              <VendorsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RequireAdmin>
              <ProductsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RequireAdmin>
              <OrdersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/riders"
          element={<Navigate to="/admin/delivery" replace />}
        />
        <Route
          path="/admin/delivery"
          element={
            <RequireAdmin>
              <DeliveryPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <RequireAdmin>
              <SectionPage sectionKey="finance" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RequireAdmin>
              <SectionPage sectionKey="analytics" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <RequireAdmin>
              <SectionPage sectionKey="reviews" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/promotions"
          element={
            <RequireAdmin>
              <SectionPage sectionKey="promotions" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <RequireAdmin>
              <ActivityPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <RequireAdmin>
              <SectionPage sectionKey="locations" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/security"
          element={
            <RequireAdmin>
              <SectionPage sectionKey="security" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAdmin>
              <SectionPage sectionKey="reports" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/commissions"
          element={
            <RequireAdmin>
              <CommissionsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAdmin>
              <SettingsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/carousel"
          element={
            <RequireAdmin>
              <CarouselPage />
            </RequireAdmin>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
